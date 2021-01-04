pragma solidity ^0.5.17;

import "./ERC20NonTransferrable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "../../../registry/AdminRole.sol";
import "../../../registry/Registry.sol";
import "./ITokenManager.sol";
import "../Escapable.sol";
import "../vault/TokenBank.sol";

/// @title A redeemable token for Commons Stack fundraising
/// @author Nelson Melina
/// @notice
/// @dev
contract RCSTKToken is
    ERC20NonTransferrable,
    ERC20Detailed,
    ERC20Mintable,
    AdminRole,
    Escapable
{
    /// @notice This will also deploy the Registry and TokenBank
    /// @dev
    /// @param _numerators (uint256[]) multiplication factors for the iterations
    /// @param _denominators (uint256[]) division factors for the iterations
    /// @param _softCaps (uint256[]) soft caps for the iterations, in DAI
    /// @param _hardCaps (uint256[]) hard caps for the iterations, in DAI
    /// @param _tokenBankAddress (address) TokenBank address
    /// @param _cstkTokenAddress (address) CSTK Token address: 0xd53b50a6213ee7ff2fcc41a7cf69d22ded0a43b3 on Mainnet
    /// @param _cstkTokenManagerAddress (address) CSTK Token Manager address: 0x696e40ba67d890422421886633195013b62c9c44 on Mainnet
    /// @param _registryAddress (address) Registry address (TO BE DEPLOYED)
    /// @param _admins (address[]) list of admin addresses for rCSTK, registry and TokenBank TODO: Define these addresses
    /// @param _escapeHatchCaller (address) Escape Hatch caller TODO: Define these addresses
    /// @param _escapeHatchDestination (address) Escape Hatch destination: TODO: Define these addresses
    constructor(
        uint256[] memory _numerators,
        uint256[] memory _denominators,
        uint256[] memory _softCaps,
        uint256[] memory _hardCaps,
        address _tokenBankAddress,
        address _cstkTokenAddress,
        address _cstkTokenManagerAddress,
        address _registryAddress,
        address[] memory _admins,
        address _escapeHatchCaller, /// @notice the RCSTK Token, Registry and TokenBank share the same escape hatch caller and destination.
        address payable _escapeHatchDestination
    )
        public
        ERC20Detailed("Redeemable CSTK Token", "rCSTK", 18)
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        cstkToken = IERC20(_cstkTokenAddress);
        cstkTokenManager = ITokenManager(_cstkTokenManagerAddress);
        registry = Registry(_registryAddress); // TODO: consider extracting IRegistry.
        bank = TokenBank(_tokenBankAddress); // TODO: consider extracting ITokenBank.

        require(
            _numerators.length == _denominators.length &&
                _denominators.length == _softCaps.length &&
                _softCaps.length == _hardCaps.length,
            "Parameters must be of same length"
        );
        /**
            Iteration 1: CSTK rate = 2.5 CSTK/DAI, Soft Cap =  984000 DAI, Hard Cap =  1250000 DAI
            _newIteration(5, 2, 984000, 1250000);
            Iteration 2: CSTK rate = 2 CSTK/DAI, Soft Cap =  796000 DAI, Hard Cap =  1000000 DAI
            _newIteration(2, 1, 796000, 1000000);
            Iteration 3: CSTK rate = 1.5 CSTK/DAI, Soft Cap =  1170000 DAI, Hard Cap =  1500000 DAI
            _newIteration(3, 2, 1170000, 1500000);
            Iteration 4: CSTK rate = 1.25 CSTK/DAI, Soft Cap =  820000 DAI, Hard Cap =  1000000 DAI
            _newIteration(5, 4, 820000, 1000000);
            Iteration 5: CSTK rate = 1 CSTK/DAI, Soft Cap =  2950000 DAI, Hard Cap =  3750000 DAI
            _newIteration(1, 1, 2950000, 3750000);
         */

        for (uint256 index = 0; index < _numerators.length; index++) {
            _newIteration(
                _numerators[index],
                _denominators[index],
                _softCaps[index],
                _hardCaps[index]
            );
        }
        currentState = State.CREATED;
    }

    struct Iteration {
        bool active;
        uint256 numerator; /// @dev multiplication factor
        uint256 denominator; /// @dev multiplication factor
        uint256 softCap; /// @dev in DAI
        uint256 hardCap; /// @dev in DAI
        uint256 startBlock; /// @dev when did this iteration start
        uint256 softCapTimestamp; /// @dev when the softcap was reached
        uint256 totalReceived; /// @dev total DAI received in this iteration
    }

    /// @notice State of the fundraise
    enum State {CREATED, ACTIVE, INACTIVE, END_RAISE_STARTED, FINISHED}
    State public currentState;

    /// @notice Number of existing iterations
    uint256 public numIterations;

    /// @notice List of iterations: iterations[index]
    mapping(uint256 => Iteration) public _iterations;

    /// @notice Commons Stack ERC20 token smart contract
    IERC20 public cstkToken;

    /// @notice Whitelisting Registry smart contract
    Registry public registry;

    /// @notice Commons Stack Token manager smart contract
    ITokenManager public cstkTokenManager;

    /// @notice Constant for 5 days in seconds
    uint256 private constant FIVE_DAYS_IN_SECONDS = 432000;

    /// @notice Token Bank smart smart contract
    TokenBank public bank;

    uint256 public endRaiseTimestamp;

    event FinishRaise();
    event MaximumTrustReached(address wallet);
    event SoftCapReached(uint256 iteration);
    event HardCapReached(uint256 iteration);

    /// @dev only contributors whitelisted in the Registry will be allowed to use functions modified by this
    modifier onlyContributor(address wallet) {
        require(
            registry.getMaxTrust(wallet) != 0,
            "Only contributors can call this"
        );
        _;
    }

    modifier onlyIfActive() {
        require(
            currentState == State.ACTIVE,
            "This contract is not in ACTIVE state"
        );
        _;
    }

    modifier iterationExist(uint256 index) {
        require(index < numIterations, "This iteration does not exist yet.");
        _;
    }

    modifier iterationActive(uint256 index) {
        require(
            _iterations[index].active,
            "This iteration is not active at this time."
        );
        _;
    }

    modifier iterationSoftCapNotReached(uint256 index) {
        require(
            _iterations[index].softCapTimestamp == 0,
            "This iteration has reached its Soft Cap already."
        );
        _;
    }

    modifier iterationSoftCapReached(uint256 index) {
        require(
            _iterations[index].softCapTimestamp > 0,
            "This iteration has reached its Soft Cap already."
        );
        _;
    }

    modifier hasBalance(address wallet) {
        require(balanceOf(wallet) > 0, "User has an empty balance.");
        _;
    }

    /// @notice Creates a new iteration phase
    /// @dev Only called by constructor. Iterations are hardcoded for rCSTK
    /// @param _numerator (uint256) multiplication factor
    /// @param _denominator (uint256) multiplication factor
    /// @param _softCap (uint256) in DAI
    /// @param _hardCap (uint256) in DAI
    /// @return iterationID (uint256) new iteration's ID
    function _newIteration(
        uint256 _numerator,
        uint256 _denominator,
        uint256 _softCap,
        uint256 _hardCap
    ) internal returns (uint256 iterationID) {
        iterationID = numIterations++ - 1;
        _iterations[iterationID] = Iteration(
            false,
            _numerator,
            _denominator,
            _softCap,
            _hardCap,
            0,
            0,
            0
        );
        return iterationID;
    }

    /// @notice Start the first iteration of the fundraise
    function startFirstIteration() public iterationExist(0) onlyAdmin {
        /// @dev Iterations are created in the constructor, so it should exist
        require(
            _iterations[0].startBlock == 0,
            "First iteration has already been started"
        );
        _iterations[0].startBlock = block.number;
        _iterations[0].active = true;
    }

    /// @notice Change iteration phase.
    function switchIteration() public onlyAdmin onlyIfActive {
        require(
            totalSupply() == 0,
            "Before switching iterations all rCSTK tokens must be redeemed"
        );

        uint256 currentIterationNumber = getCurrentIterationNumber();

        require(
            currentIterationNumber + 1 < numIterations,
            "Next iteration does not exist."
        );

        require(
            _iterations[currentIterationNumber].softCapTimestamp > 0,
            "softCap has not been reached yet on the active iteration"
        );

        require(
            block.timestamp >
                _iterations[currentIterationNumber].softCapTimestamp +
                    FIVE_DAYS_IN_SECONDS ||
                _iterations[currentIterationNumber].totalReceived >=
                _iterations[currentIterationNumber].hardCap,
            "Hardcap has not been reached, and it has been less than 5 days since the softcap was reached"
        );

        _iterations[currentIterationNumber].active = false;
        _iterations[currentIterationNumber + 1].active = true;
        _iterations[currentIterationNumber + 1].startBlock = block.number;
    }

    /// @notice Donate DAI and get rCSTK tokens in exchange
    /// @dev Maybe better to change function name to something else than buy
    /// @param _amountDAI (uint256) DAI amount the user wants to donate
    /// @return  DAI amount donated by the user
    function donate(uint256 _amountDAI)
        public
        onlyIfActive
        onlyContributor(msg.sender)
        returns (uint256 amountDAIDonated)
    {
        uint256 currentIterationNumber = getCurrentIterationNumber();

        require(
            _iterations[currentIterationNumber].totalReceived <
                _iterations[currentIterationNumber].hardCap,
            "This iteration has reached its hardCap already"
        );
        // @notice Determine how many CSTK tokens the donor will receive
        uint256 amountTokens = SafeMath.div(
            SafeMath.mul(
                _amountDAI,
                _iterations[currentIterationNumber].numerator
            ),
            _iterations[currentIterationNumber].denominator
        );

        // @notice Check if the donor is not trusted to enough to receive this many rCSTK tokens
        if (
            SafeMath.add(
                SafeMath.add(
                    balanceOf(msg.sender),
                    cstkToken.balanceOf(msg.sender)
                ),
                amountTokens
            ) >= registry.getMaxTrust(msg.sender)
        ) {
            /// @dev If this donation would give them more CSTK tokens then they are trusted to hold, we calculate how many tokens they can be trusted to hold and reduce their donation, they can donate the extra DAI directly to the Commons Stack Donation Address
            amountTokens = SafeMath.sub(
                registry.getMaxTrust(msg.sender),
                SafeMath.add(
                    balanceOf(msg.sender),
                    cstkToken.balanceOf(msg.sender)
                )
            );

            _amountDAI = SafeMath.div(
                SafeMath.mul(
                    amountTokens,
                    _iterations[currentIterationNumber].denominator
                ),
                _iterations[currentIterationNumber].numerator
            );

            emit MaximumTrustReached(msg.sender);
        }

        if (
            _amountDAI >
            _iterations[currentIterationNumber].hardCap -
                _iterations[currentIterationNumber].totalReceived
        ) {
            /// @dev donate only up to the hardcap.
            _amountDAI = SafeMath.sub(
                _iterations[currentIterationNumber].hardCap,
                _iterations[currentIterationNumber].totalReceived
            );

            amountTokens = SafeMath.div(
                SafeMath.mul(
                    _amountDAI,
                    _iterations[currentIterationNumber].numerator
                ),
                _iterations[currentIterationNumber].denominator
            );
        }

        if (_amountDAI != 0) {
            bank.deposit(msg.sender, _amountDAI);
            _iterations[currentIterationNumber].totalReceived = SafeMath.add(
                _iterations[currentIterationNumber].totalReceived,
                _amountDAI
            );

            if (
                _iterations[currentIterationNumber].totalReceived >
                _iterations[currentIterationNumber].softCap &&
                _iterations[currentIterationNumber].softCapTimestamp == 0
            ) {
                /// @dev Soft Cap is reached.
                _iterations[currentIterationNumber].softCapTimestamp = block
                    .timestamp;
                bank.storeAllInVault();
                emit SoftCapReached(currentIterationNumber);
            }

            if (_iterations[currentIterationNumber].softCapTimestamp == 0) {
                _mint(msg.sender, amountTokens);
            } else {
                /// @dev If softCap was reached we directly mint CSTK tokens and store donation into the Vault.
                cstkTokenManager.mint(msg.sender, amountTokens);
                bank.storeInVault(msg.sender, _amountDAI);
            }
            if (
                _iterations[currentIterationNumber].totalReceived ==
                _iterations[currentIterationNumber].hardCap
            ) {
                emit HardCapReached(currentIterationNumber);
            }
        }
        return _amountDAI;
    }

    /// @notice burns rCSTK tokens, get some DAI back. Booooo :-/
    /// @param _amountTokens (uint256) amount of tokens to give back.
    function ditchTokens(uint256 _amountTokens) public hasBalance(msg.sender) {
        /// @dev Comment that. Change name of FIVE_DAYS_IN_SECONDS compared to the one in softcap.
        require(
            currentState == State.ACTIVE ||
                (endRaiseTimestamp != 0 &&
                    currentState == State.END_RAISE_STARTED &&
                    block.timestamp < endRaiseTimestamp + FIVE_DAYS_IN_SECONDS),
            "This contract is not in ACTIVE state or 5 days after end of fundraise."
        );

        uint256 currentIterationNumber = getCurrentIterationNumber();

        uint256 _amountDAI = SafeMath.mul(
            SafeMath.div(
                _amountTokens,
                _iterations[currentIterationNumber].denominator
            ),
            _iterations[currentIterationNumber].numerator
        );
        _burn(msg.sender, _amountTokens);
        bank.withdraw(msg.sender, _amountDAI);
        _iterations[currentIterationNumber].totalReceived = SafeMath.sub(
            _iterations[currentIterationNumber].totalReceived,
            _amountDAI
        );
    }

    /// @notice redeem rCSTK tokens for CSTK tokens. Irreversible.
    /// @param _amountTokens (uint256) rCSTK tokensamount to convert to CSTK.
    function redeemTokens(uint256 _amountTokens) public hasBalance(msg.sender) {
        uint256 currentIterationNumber = getCurrentIterationNumber();
        _redeemTokens(msg.sender, currentIterationNumber, _amountTokens);
    }

    /// @notice redeem rCSTK tokens for CSTK tokens for all accounts in TokenBank. Irreversible.
    function redeemContributors(address[] memory accounts, uint256 _iteration)
        public
        iterationSoftCapReached(_iteration)
    {
        for (uint256 index = 0; index < accounts.length; index++) {
            _redeemTokens(
                accounts[index],
                _iteration,
                balanceOf(accounts[index])
            );
        }
    }

    /// @notice
    /// @dev
    /// @param contributor (address)
    /// @param _amountTokens (uint256)
    function _redeemTokens(
        address contributor,
        uint256 _iteration,
        uint256 _amountTokens
    ) internal {
        ///mint CSTK tokens
        cstkTokenManager.mint(contributor, _amountTokens);

        uint256 _amountDAI = SafeMath.div(
            SafeMath.mul(_amountTokens, _iterations[_iteration].denominator),
            _iterations[_iteration].numerator
        );
        bank.storeInVault(contributor, _amountDAI);
        _burn(msg.sender, _amountTokens);
    }

    /// @notice In case there is an issue this fundraise can be stopped
    function pause() public onlyAdmin {
        require(currentState == State.ACTIVE, "Current state is not active");
        currentState = State.INACTIVE;
    }

    /// @notice If everything is ok the fundraise can be restarted
    function unpause() public onlyAdmin {
        require(
            currentState == State.INACTIVE,
            "Current state is not inactive"
        );
        currentState = State.ACTIVE;
    }

    /// @notice Start the process of finishing the fundraise.
    function startEndRaise() public onlyAdmin onlyIfActive {
        currentState = State.END_RAISE_STARTED;
        endRaiseTimestamp = block.timestamp;
    }

    /// @notice Finish the fundraise.
    function finishEndRaise() public onlyAdmin {
        require(
            currentState == State.END_RAISE_STARTED &&
                block.timestamp > endRaiseTimestamp + FIVE_DAYS_IN_SECONDS,
            "End of raise has not started more than 5 days ago."
        );
        bank.storeAllInVault();
        bank.drainVault();
        currentState = State.FINISHED;
        emit FinishRaise();
    }

    /// @notice Finish the fundraise.
    function getCurrentIterationNumber()
        public
        view
        returns (uint256 currentIterationNumber)
    {
        for (uint256 index = 0; index < numIterations; index++) {
            if (_iterations[index].active == true) {
                currentIterationNumber = index;
                break;
            }
        }
        return currentIterationNumber;
    }
}
