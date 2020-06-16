pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

import "./ERC20NonTransferrable.sol";
import "./IterationList.sol";
import "../Escapable.sol";
import "../../../registry/AdminRole.sol";

// TODO: check if Registry and TokenBank share the same escapeHatch parameters during construction.

contract RCSTK is
    ERC20NonTransferrable,
    ERC20Detailed,
    ERC20Mintable,
    AdminRole,
    Escapable
{
    using IterationList for IterationList.Data;

    //
    // CONSTANTS:
    //

    enum FundraiseState {CREATED, ACTIVE, PAUSED, END_RAISE, FINISHED}

    uint256 private constant FIVE_DAYS_IN_SECONDS = 432000;
    string private constant SYMBOL = "rCSTK";
    string private constant NAME = "Redeemable CSTK Token";
    uint8 private constant DECIMALS = 18;

    //
    // STORAGE:
    //

    /// @dev List of iterations for the token sale.
    IterationList.Data internal iterations;

    /// @dev Current state of the fundraise.
    FundraiseState internal state;

    //
    // EVENTS:
    //

    /// @dev Emit when the fundraise has been started.
    event FundraiseStarted();

    /// @dev Emit when switched fundraise iteration.
    event SwitchedIteration(uint16 num);

    //
    // MODIFIERS:
    //

    /// @dev Revert if not in ACTIVE state.
    modifier onlyActiveState() {
        require(
            state == FundraiseState.ACTIVE,
            "Fundraise state must be ACTIVE"
        );
        _;
    }

    //
    // CONSTRUCTOR:
    //

    /// @notice Construct and initiialize the RCSTK token.
    /// @dev This will also connect the Registry and Token Bank contracts.
    /// RCSTK Token, Registry and TokenBank share the same escape hatch caller and destination.
    constructor(
        uint256 _cnt,
        uint256[] memory _numerators,
        uint256[] memory _denominators,
        uint256[] memory _softCaps,
        uint256[] memory _hardCaps,
        address _tokenBankAddress,
        address _cstkTokenAddress,
        address _cstkTokenManagerAddress,
        address _registryAddress,
        address[] memory _admins,
        address _escapeHatchCaller,
        address payable _escapeHatchDestination
    )
        public
        ERC20Detailed(NAME, SYMBOL, DECIMALS)
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        // Check input parameters:
        require(_cnt >= 1, "Must have at least one iteration");
        require(_cnt == _numerators.length, "Invalid number of numerators");
        require(_cnt == _denominators.length, "Invalid number of denominators");
        require(_cnt == _softCaps.length, "Invalid number of soft cap values");
        require(_cnt == _hardCaps.length, "Invalid number of hard cap values");

        require(
            _tokenBankAddress != address(0),
            "TokenBank must not be zero address"
        );
        require(
            _cstkTokenAddress != address(0),
            "CSTK Token must not be zero address"
        );
        require(
            _cstkTokenManagerAddress != address(0),
            "CSTK Token Manager must not be zero address"
        );
        require(
            _registryAddress != address(0),
            "Registry must not be zero address"
        );

        _addIterations(_cnt, _numerators, _denominators, _softCaps, _hardCaps);

        state = FundraiseState.CREATED;
    }

    //
    // EXTERNAL FUNCTIONS:
    //

    /// @notice Start the fundraise by marking the first iteration as active.
    /// @dev The fundraise should have at least one iteration set in the constructor.
    function startFundraise() external onlyAdmin {
        require(state == FundraiseState.CREATED, "Fundraise already started");

        iterations.startFirst(block.number);
        state = FundraiseState.ACTIVE;

        emit FundraiseStarted();
    }

    /// @notice Switch to the next iteration of the fundraise.
    /// @dev Fundraise must be in ACTIVE state. All tokens from the active iteration must be redeemed.
    function switchIteration() external onlyAdmin onlyActiveState {
        require(
            totalSupply() == 0,
            "Not all rCSTK tokens from active iteration redeemed"
        );

        require(iterations.softCapTimestamp() != 0, "Soft cap not reached");
        require(
            iterations.hasReachedHardCap() || _overSoftCapTimeLimit(),
            "Neither hard cap not soft cap time limit reached"
        );

        iterations.next(block.number);

        emit SwitchedIteration(iterations.cur);
    }

    /// @notice Get the current status of the fundraise.
    /// @dev Retuns a status code.
    /// @return code (FundraiseState) - status code
    function getFundraiseState() external view returns (FundraiseState code) {
        return state;
    }

    /// @notice Get the current active iteration.
    /// @return started (bool) - True if the fundraise was started
    /// @return no (uint16) - Currently active iteration
    function getActiveIteration()
        external
        view
        returns (bool started, uint16 no)
    {
        return iterations.currentIteration();
    }

    /// @notice Get the number of iterations for the fundraise.
    /// @return iterationCnt (uint16) - Number of iterations
    function getIterationCnt() external view returns (uint16 iterationCnt) {
        return iterations.cnt;
    }

    /// @notice Return an enumerated list of iterations of the fundraise.
    /// @return numerators (uint256[] memory) - Numerator factors
    /// @return denominators (uint256[] memory) - Denominator factors
    /// @return softCaps (uint256[] memory) - Soft cap values
    /// @return hardCaps (uint256[] memory) - Hard cap values
    function getIterations()
        external
        view
        returns (
            uint256[] memory numerators,
            uint256[] memory denominators,
            uint256[] memory softCaps,
            uint256[] memory hardCaps
        )
    {
        return iterations.enumerate();
    }

    //
    // INTERNAL FUNCTIONS:
    //

    /// @dev Add a new iteration to the list.
    function _addIterations(
        uint256 _cnt,
        uint256[] memory _numerators,
        uint256[] memory _denominators,
        uint256[] memory _softCaps,
        uint256[] memory _hardCaps
    ) internal {
        for (uint256 i = 0; i < _cnt; i++) {
            iterations.add(
                _numerators[i],
                _denominators[i],
                _softCaps[i],
                _hardCaps[i]
            );
        }
    }

    function _overSoftCapTimeLimit() internal view returns (bool ok) {
        return
            block.timestamp >=
            iterations.softCapTimestamp() + FIVE_DAYS_IN_SECONDS;
    }
}
