pragma solidity ^0.5.0;

import "./ERC20NonTransferrable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "../../../registry/AdminRole.sol";
import "../../../registry/Registry.sol";
import "./TokenManager.sol";
import "../Escapable.sol";
import "../vault/TokenBank.sol";


/// @title A redeemable token for Commons Stack fundraising.
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
    /// @notice This will also deploy the Registry and TokenBank.
    /// @dev
    /// @param numerators (uint256[]) multiplication factors for the iterations.
    /// @param denominators (uint256[]) multiplication factors for the iterations.
    /// @param softCaps (uint256[]) soft caps for the iterations, in DAI.
    /// @param hardCaps (uint256[]) hard caps for the iterations, in DAI.
    /// @param daiTokenAddress (address) DAI token address. 0x6b175474e89094c44da98b954eedeac495271d0f on Mainnet. https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f
    /// @param cstkTokenAddress (address) CSTK Token address. 0xd53b50a6213ee7ff2fcc41a7cf69d22ded0a43b3 on Mainnet. https://etherscan.io/address/0xd53b50a6213ee7ff2fcc41a7cf69d22ded0a43b3
    /// @param cstkTokenManagerAddress (address) CSTK Token Manager address.
    /// @param registryAddress (address) Registry address.
    /// @param _admins (address[]) list of admin addresses for rCSTK, registry and TokenBank.
    /// @param _escapeHatchCaller (address) Escape Hatch caller.
    /// @param _escapeHatchDestination (address) Escape Hatch destination.
    constructor(
        uint256[] memory numerators,
        uint256[] memory denominators,
        uint256[] memory softCaps,
        uint256[] memory hardCaps,
        address daiTokenAddress,
        address cstkTokenAddress,
        address cstkTokenManagerAddress,
        address registryAddress,
        address[] memory _admins,
        address _escapeHatchCaller, /// @notice the RCSTK Token, Registry and TokenBank share the same escape hatch caller and destination.
        address payable _escapeHatchDestination,
        address _drainVaultReceiver
    )
        public
        ERC20Detailed("Redeemable CSTK Token", "rCSTK", 18)
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        cstkToken = IERC20(cstkTokenAddress);
        cstkTokenManager = TokenManager(cstkTokenManagerAddress);
        registry = Registry(registryAddress);
        bank = new TokenBank(
            daiTokenAddress,
            _admins,
            _drainVaultReceiver,
            _escapeHatchCaller,
            _escapeHatchDestination
        );
        require(
            numerators.length == denominators.length &&
                denominators.length == softCaps.length &&
                softCaps.length == hardCaps.length,
            "numerators, denominators, softCaps and hardCaps need to be of same length."
        );
        /**
            _newIteration(5, 2, 984000, 1250000);
            _newIteration(2, 1, 796000, 1000000);
            _newIteration(3, 2, 1170000, 1500000);
            _newIteration(5, 4, 820000, 1000000);
            _newIteration(1, 1, 2950000, 3750000);
         */
        for (uint256 index = 0; index < numerators.length; index++) {
            _newIteration(
                numerators[index],
                denominators[index],
                softCaps[index],
                hardCaps[index]
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

    enum State {CREATED, ACTIVE, INACTIVE, END_RAISE_STARTED, FINISHED}
    State currentState;

    /// @notice Number of existing iterations.
    uint256 internal numIterations;

    /// @notice List of iterations. iterations[index]
    mapping(uint256 => Iteration) internal iterations;

    /// @notice Commons Stack ERC20 token smart contract.
    IERC20 internal cstkToken;

    /// @notice Whitelisting Registry smart contract.
    Registry internal registry;

    /// @notice Commons Stack Token manager smart contract.
    TokenManager internal cstkTokenManager;

    /// @notice Constant for 5 days in seconds.
    uint256 private constant FIVE_DAYS_IN_SECONDS = 432000;

    /// @notice Token Bank smart smart contract.
    TokenBank internal bank;

    uint256 endRaiseTimestamp;

    event FinishRaise();
    event MaximumTrustReached(address wallet);
    event SoftCapReached(uint8 iteration);
    event HardCapReached(uint8 iteration);

    /// @dev only contributors whitelisted in the Registry will be allowed to use functions modified by this.
    modifier onlyContributor(address wallet) {
        require(
            registry.isContributor(wallet),
            "Only contributors can call this."
        );
        _;
    }

    modifier onlyIfActive() {
        require(
            currentState == State.ACTIVE,
            "THis contract is not in ACTIVE state."
        );
        _;
    }

    /// @notice Creates a new iteration phase.
    /// @dev Only called by constructor. Iterations are hardcoded for rCSTK.
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
        iterations[iterationID] = Iteration(
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

    /// @notice Start the first iteration of the fundraise.
    function startFirstIteration() public onlyAdmin {
        /// @dev Should not happen. as iterations are created in the constructor.
        require(
            _iterationExists(0),
            "First iteration has not been created yet."
        );
        require(
            iterations[0].startBlock == 0,
            "First iteration has already been started."
        );
        iterations[0].startBlock = block.number;
        iterations[0].active = true;
    }

    /// @notice Change iteration phase.
    /// @param _iterationTo (uint8) iteration wewant to switch to
    function switchIteration(uint8 _iterationTo) public onlyAdmin onlyIfActive {
        require(
            totalSupply() == 0,
            "Before switching iteration all rCSTK tokens should be redeemed."
        );
        require(
            iterations[_iterationTo - 1].active == true,
            "_iterationFrom is not the active iteration."
        );

        require(
            iterations[_iterationTo - 1].softCapTimestamp > 0,
            "softCap has not been reached yet on the active iteration."
        );

        require(
            block.timestamp >
                iterations[_iterationTo - 1].softCapTimestamp +
                    FIVE_DAYS_IN_SECONDS ||
                iterations[_iterationTo - 1].totalReceived >=
                iterations[_iterationTo - 1].hardCap,
            "Softcap timestamp has been reached less than 5 days ago and hard cap has not been reached."
        );

        require(
            totalSupply() == 0,
            "Before switching iteration all rCSTK tokens should be redeemed."
        );

        iterations[_iterationTo - 1].active = false;
        iterations[_iterationTo].active = true;
        iterations[_iterationTo].startBlock = block.number;
    }

    /// @notice Donate DAI and get rCSTK tokens in exchange.
    /// @dev Maybe better to change function name to something else than buy.
    /// @param _iteration (uint8) iteration at which contributor wants to donate.
    /// @param _amountDAI (uint256) DAI amount the user wants to donate.
    /// @return  DAI amount donated by the user.
    function donate(uint8 _iteration, uint256 _amountDAI)
        public
        onlyIfActive
        onlyContributor(msg.sender)
        returns (uint256 amountDAIDonated)
    {
        require(
            _iteration < numIterations,
            "This iteration does not exist yet."
        );
        require(
            iterations[_iteration].active,
            "This iteration is not active at this time."
        );

        require(
            iterations[_iteration].totalReceived <
                iterations[_iteration].hardCap,
            "This iteration has reached its hardCap already."
        );

        uint256 amountTokens = SafeMath.div(
            SafeMath.mul(_amountDAI, iterations[_iteration].numerator),
            iterations[_iteration].denominator
        );

        if (
            balanceOf(msg.sender) +
                cstkToken.balanceOf(msg.sender) +
                amountTokens >=
            registry.getAllowed(msg.sender)
        ) {
            /// @dev we only take donation up to the amount that would get them to their maximum CSTK allowance.
            _amountDAI = SafeMath.div(
                SafeMath.mul(amountTokens, iterations[_iteration].denominator),
                iterations[_iteration].numerator
            );

            amountTokens = SafeMath.sub(
                registry.getAllowed(msg.sender),
                SafeMath.add(
                    balanceOf(msg.sender),
                    cstkToken.balanceOf(msg.sender)
                )
            );
            emit MaximumTrustReached(msg.sender);
        }

        if (
            _amountDAI >=
            iterations[_iteration].hardCap -
                iterations[_iteration].totalReceived
        ) {
            /// @dev donate only up to the hardcap.
            _amountDAI =
                iterations[_iteration].hardCap -
                iterations[_iteration].totalReceived;

            amountTokens = SafeMath.div(
                SafeMath.mul(_amountDAI, iterations[_iteration].numerator),
                iterations[_iteration].denominator
            );
        }

        if (_amountDAI != 0) {
            bank.deposit(msg.sender, _amountDAI);
            iterations[_iteration].totalReceived = SafeMath.add(
                iterations[_iteration].totalReceived,
                _amountDAI
            );

            if (
                iterations[_iteration].totalReceived >
                iterations[_iteration].softCap &&
                iterations[_iteration].softCapTimestamp == 0
            ) {
                /// @dev Soft Cap is reached.
                iterations[_iteration].softCapTimestamp = block.number;
                bank.storeAllInVault();
                emit SoftCapReached(_iteration);
            }

            if (iterations[_iteration].softCapTimestamp == 0) {
                _mint(msg.sender, amountTokens);
            } else {
                /// @dev If softCap was reached we directly mint CSTK tokens and store donation into the Vault.
                cstkTokenManager.mint(msg.sender, amountTokens);
                bank.storeInVault(msg.sender, _amountDAI);
            }
            if (
                iterations[_iteration].totalReceived >=
                iterations[_iteration].hardCap
            ) {
                emit HardCapReached(_iteration);
            }
        }
        return _amountDAI;
    }

    /// @notice burns rCSTK tokens, get some DAI back. Boooooh :-/
    /// @param _iteration (uint8) Iteration ID
    /// @param _amountTokens (uint256) amount of tokens to give back.
    function ditchTokens(uint8 _iteration, uint256 _amountTokens)
        public
        onlyContributor(msg.sender)
    {
        require(
            currentState == State.ACTIVE ||
                (endRaiseTimestamp != 0 &&
                    currentState == State.FINISHED &&
                    block.timestamp > endRaiseTimestamp + FIVE_DAYS_IN_SECONDS),
            "This contract is not in ACTIVE state or 5 days after end of fundraise."
        );
        require(
            _iteration < numIterations,
            "This iteration does not exist yet."
        );
        require(
            iterations[_iteration].active,
            "This iteration is not active at this time."
        );
        require(
            iterations[_iteration].softCapTimestamp == 0,
            "This iteration has reached its softCap already."
        );

        uint256 _amountDAI = SafeMath.mul(
            _amountTokens,
            SafeMath.div(
                iterations[_iteration].denominator,
                iterations[_iteration].numerator
            )
        );
        _burn(msg.sender, _amountTokens);
        bank.withdraw(msg.sender, _amountDAI);
        iterations[_iteration].totalReceived = SafeMath.sub(
            iterations[_iteration].totalReceived,
            _amountDAI
        );
    }

    /// @notice redeem rCSTK tokens for CSTK tokens. Irreversible.
    /// @param _iteration (uint8) iteration ID
    /// @param _amountTokens (uint256) rCSTK tokensamount to convert to CSTK.
    function redeemTokens(uint8 _iteration, uint256 _amountTokens)
        public
        onlyContributor(msg.sender)
    {
        require(
            _iteration < numIterations,
            "This iteration does not exist yet."
        );
        require(
            iterations[_iteration].active,
            "This iteration is not active at this time."
        );
        _redeemTokens(msg.sender, _iteration, _amountTokens);
    }

    /// @notice redeem rCSTK tokens for CSTK tokens for all accounts in TokenBank. Irreversible.
    function redeemContributors(address[] memory accounts, uint8 _iteration)
        public
        onlyAdmin
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
        uint8 _iteration,
        uint256 _amountTokens
    ) internal {
        ///mint CSTK tokens
        cstkTokenManager.mint(contributor, _amountTokens);

        uint256 _amountDAI = SafeMath.mul(
            _amountTokens,
            SafeMath.div(
                iterations[_iteration].denominator,
                iterations[_iteration].numerator
            )
        );
        bank.storeInVault(contributor, _amountDAI);
        _burn(msg.sender, _amountTokens);
    }

    /// @notice
    /// @dev
    /// @param _idx (uint256)
    /// @return  (bool)
    function _iterationExists(uint256 _idx) internal view returns (bool) {
        // TODO: check the criteria to match for an initialized iteration:
        return iterations[_idx].softCap != 0;
    }

    /// @notice Start the process of finishing the fundraise.
    function pause() public onlyAdmin {
        require(currentState == State.ACTIVE, "Current state is not active");
        currentState = State.INACTIVE;
    }

    /// @notice Start the process of finishing the fundraise.
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
        endRaiseTimestamp = block.number;
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
}
