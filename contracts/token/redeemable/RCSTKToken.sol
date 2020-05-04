pragma solidity ^0.5.0;

import "./RedeemableToken.sol";
import "./ERC20NonTransferrable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../registry/AdminRole.sol";
import "../../registry/Registry.sol";
import "./TokenManager.sol";
import "./Escapable.sol";
import "./vault/TokenBank.sol";


/// @title A redeemable token for Commons Stack fundraising.
/// @author Nelson Melina
/// @notice
/// @dev
contract RCSTKToken is
    ERC20NonTransferrable,
    RedeemableToken,
    AdminRole,
    Escapable
{
    /// @notice This will also deploy the Registry and TokenBank.
    /// @dev
    /// @param daiTokenAddress (address) DAI token address. 0x6b175474e89094c44da98b954eedeac495271d0f on Mainnet. https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f
    /// @param cstkTokenAddress (address) CSTK Token address. 0xd53b50a6213ee7ff2fcc41a7cf69d22ded0a43b3 on Mainnet. https://etherscan.io/address/0xd53b50a6213ee7ff2fcc41a7cf69d22ded0a43b3
    /// @param cstkTokenManagerAddress (address)
    /// @param _admins (address[]) list of admin addresses for rCSTK, registry and TokenBank.
    /// @param _escapeHatchCaller (address) Escape Hatch caller.
    /// @param _escapeHatchDestination (address) Escape Hatch destination.
    constructor(
        address daiTokenAddress,
        address cstkTokenAddress,
        address cstkTokenManagerAddress,
        address[] memory _admins,
        address _escapeHatchCaller, /// @notice the RCSTK Token, Registry and TokenBank share the same escape hatch caller and destination.
        address payable _escapeHatchDestination
    )
        public
        RedeemableToken("Redeemable CSTK Token", "rCSTK", false)
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        cstkToken = IERC20(cstkTokenAddress);
        cstkTokenManager = TokenManager(cstkTokenManagerAddress);
        registry = new Registry(_admins);
        bank = new TokenBank(
            daiTokenAddress,
            _admins,
            _escapeHatchDestination,
            _escapeHatchCaller,
            _escapeHatchDestination
        );

        newIteration(5, 2, 984000, 1250000);
        newIteration(2, 1, 796000, 1000000);
        newIteration(3, 2, 1170000, 1500000);
        newIteration(5, 4, 820000, 1000000);
        newIteration(1, 1, 2950000, 3750000);
        for (uint256 index = 0; index < _admins.length; index++) {
            addPauser(_admins[index]);
        }
        pause();
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
        mapping(address => uint256) spendable; /// @dev who has spent how much of his balance (redeemed for DAI or converted to CSTK)
    }

    /// @notice
    uint256 numIterations;
    /// @notice
    mapping(uint256 => Iteration) iterations;

    /// @notice
    IERC20 cstkToken;

    /// @notice
    Registry internal registry;
    /// @notice
    TokenManager internal cstkTokenManager;

    /// @notice
    uint256 FIVE_DAYS_IN_SECONDS = 432000;
    TokenBank internal bank;

    event FinishRaise();

    /// @dev only contributors whitelisted in the Registry will be allowed to use functions modified by this.
    modifier onlyContributor(address wallet) {
        require(
            registry.isContributor(wallet),
            "Only contributors can call this."
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
    function newIteration(
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
    /// @dev _iterationFrom is probably useless.
    /// @param _iterationFrom (uint8) current iteration
    /// @param _iterationTo (uint8) iteration wewant to switch to
    function switchIteration(uint8 _iterationFrom, uint8 _iterationTo)
        public
        onlyAdmin
    {
        require(
            _iterationFrom == _iterationTo - 1,
            "_iterationTo need to follow _iterationFrom"
        );
        require(
            iterations[_iterationFrom].active == true,
            "_iterationFrom is not the active iteration."
        );

        require(
            iterations[_iterationFrom].softCapTimestamp > 0,
            "softCap has not been reached yet on the active iteration."
        );

        iterations[_iterationFrom].active = false;
        iterations[_iterationTo].active = true;
        iterations[_iterationTo].startBlock = block.number;
        bank.storeAllInVault();
    }

    /// @notice Finish the fundraise.
    /// @dev Probably better to make it definitive instead of pausing.
    function finishRaise() public onlyAdmin {
        pause();
        bank.storeAllInVault();
        bank.drainVault();
        emit FinishRaise();
    }

    /// @notice Donate DAI and get rCSTK tokens in exchange.
    /// @dev Maybe better to change function name to something else than buy.
    /// @param _iteration (uint8) iteration at which contributor wants to donate.
    /// @param _amountDAI (uint256) DAI amount the user wants to donate.
    function buyTokens(uint8 _iteration, uint256 _amountDAI)
        public
        whenNotPaused
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

        require(
            iterations[_iteration].totalReceived ==
                iterations[_iteration].hardCap,
            "This iteration has reached its hardCap already."
        );

        require(
            block.timestamp <
                iterations[_iteration].softCapTimestamp + FIVE_DAYS_IN_SECONDS,
            "Softcap timestamp has been reached more than 5 days ago."
        );

        if (
            iterations[_iteration].totalReceived + _amountDAI >=
            iterations[_iteration].hardCap
        ) {
            ///switch iteration if passing hardcap
            uint8 iteration = _iteration;
            uint256 amountDAI = _amountDAI;

            for (
                uint256 amountDAIcurrentIteration = iterations[iteration]
                    .hardCap - iterations[iteration].totalReceived;
                iterations[iteration].totalReceived + _amountDAI >=
                iterations[iteration].hardCap;
                amountDAI = SafeMath.sub(amountDAI, amountDAIcurrentIteration)
            ) {
                _buyTokens(iteration, amountDAIcurrentIteration);
                switchIteration(iteration, iteration + 1);
                iteration++;
            }
        }
        _buyTokens(_iteration, _amountDAI);
    }

    function _buyTokens(uint8 _iteration, uint256 _amountDAI)
        internal
        whenNotPaused
    {
        uint256 amountTokens = SafeMath.mul(
            _amountDAI,
            SafeMath.div(
                iterations[_iteration].numerator,
                iterations[_iteration].denominator
            )
        );
        require(
            balanceOf(msg.sender) +
                cstkToken.balanceOf(msg.sender) +
                amountTokens <=
                registry.getAllowed(msg.sender),
            "Buying that amount of tokens would go over the allowance."
        );
        bank.deposit(msg.sender, _amountDAI);

        iterations[_iteration].totalReceived = SafeMath.add(
            iterations[_iteration].totalReceived,
            _amountDAI
        );
        iterations[_iteration].spendable[msg.sender] = SafeMath.add(
            iterations[_iteration].spendable[msg.sender],
            amountTokens
        );
        _mint(msg.sender, amountTokens);
        if (
            iterations[_iteration].totalReceived >
            iterations[_iteration].softCap
        ) {
            iterations[_iteration].softCapTimestamp = block.number;
            bank.storeAllInVault();
        }
    }

    /// @notice burns rCSTK tokens, get some DAI back. Boooooh :-/
    /// @param _iteration (uint8) Iteration ID
    /// @param _amountTokens (uint256) amount of tokens to give back.
    function ditchTokens(uint8 _iteration, uint256 _amountTokens)
        public
        whenNotPaused
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
        require(
            iterations[_iteration].softCapTimestamp == 0,
            "This iteration has reached its softCap already."
        );
        require(
            iterations[_iteration].spendable[msg.sender] >= _amountTokens,
            "This iteration has reached its softCap already."
        );

        uint256 _amountDAI = SafeMath.mul(
            _amountTokens,
            SafeMath.div(
                iterations[_iteration].denominator,
                iterations[_iteration].numerator
            )
        );
        _ditchTokens(_amountTokens, _amountDAI);

        iterations[_iteration].totalReceived = SafeMath.sub(
            iterations[_iteration].totalReceived,
            _amountDAI
        );
        iterations[_iteration].spendable[msg.sender] = SafeMath.sub(
            iterations[_iteration].spendable[msg.sender],
            _amountTokens
        );
    }

    function _ditchTokens(uint256 _amountTokens, uint256 _daiAmount)
        internal
        whenNotPaused
    {
        _burn(msg.sender, _amountTokens);
        bank.withdraw(msg.sender, _daiAmount);
    }

    /// @notice redeem rCSTK tokens for CSTK tokens. Irreversible.
    /// @param _iteration (uint8) iteration ID
    /// @param _amountTokens (uint256) rCSTK tokensamount to convert to CSTK.
    function redeemTokens(uint8 _iteration, uint256 _amountTokens)
        public
        whenNotPaused
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
        require(
            iterations[_iteration].spendable[msg.sender] >= _amountTokens,
            "This iteration has reached its softCap already."
        );
        _redeemTokens(_amountTokens);
        iterations[_iteration].spendable[msg.sender] = SafeMath.sub(
            iterations[_iteration].spendable[msg.sender],
            _amountTokens
        );
    }

    function _redeemTokens(uint256 _amountTokens) internal whenNotPaused {
        ///mint CSTK tokens
        cstkTokenManager.mint(msg.sender, _amountTokens);
        _burn(msg.sender, _amountTokens);
    }

    function _iterationExists(uint256 _idx) internal view returns (bool) {
        // TODO: check the criteria to match for an initialized iteration:
        return iterations[_idx].softCap != 0;
    }
}
