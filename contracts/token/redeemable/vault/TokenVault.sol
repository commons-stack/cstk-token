pragma solidity 0.5.17;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./ReentrancyGuard.sol";
import "../../../registry/AdminRole.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";


contract TokenVault is ReentrancyGuard, AdminRole {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    /***************
    GLOBAL CONSTANTS
    ***************/
    uint256 public summoningTime; // needed to determine the current period

    address public depositToken; // deposit token contract reference; example : DAI

    // HARD-CODED LIMITS
    uint256 constant MAX_TOKEN_WHITELIST_COUNT = 400; // maximum number of whitelisted tokens
    uint256 constant MAX_TOKEN_GUILDBANK_COUNT = 200; // maximum number of tokens with non-zero balance in guildbank

    // ***************
    // EVENTS
    // ***************
    event SummonComplete(address indexed summoner, uint256 proposalDeposit);

    event SubmitDeposit(address indexed depositor, uint256 tributeOffered);

    event Ragequit(address indexed memberAddress, uint256 amountToRagequit);

    event TokensStored(address indexed memberAddress, uint256 amountStored);

    event TokensCollected(uint256 amountToCollect);

    event Withdraw(address indexed memberAddress, uint256 amount);

    // *******************
    // INTERNAL ACCOUNTING
    // *******************
    uint256 public totalGuildBankTokens = 0; // total tokens with non-zero balance in guild bank

    address public constant GUILD = address(0xdead);
    //address public constant ESCROW = address(0xbeef);
    address public constant TOTAL = address(0xbabe);
    mapping(address => uint256) public userTokenBalances; // userTokenBalances[userAddress]

    mapping(address => bool) public tokenWhitelist;
    address[] public approvedTokens;

    EnumerableSet.AddressSet internal members;

    modifier onlyMember(address wallet) {
        require(EnumerableSet.contains(members, wallet), "not a member");
        _;
    }

    constructor(
        address _summoner, //TODO check what to do with the summoner.
        address _depositToken,
        address[] memory _admins,
        address _escapeHatchDestination
    ) public AdminRole(_admins) {
        require(_summoner != address(0), "summoner cannot be 0");
        require(_depositToken != address(0), "summoner cannot be 0"); // TODO verify that token is ERC20 too ?

        depositToken = _depositToken;
        // NOTE: move event up here, avoid stack too deep if too many approved tokens
        emit SummonComplete(_summoner, now);

        summoningTime = now;

        EnumerableSet.add(members, _summoner); //TODO probably to be removed.
        escapeHatchDestination = _escapeHatchDestination;
    }

    /*****************
    PROPOSAL FUNCTIONS
    *****************/
    function submitDeposit(address depositor, uint256 tributeOffered)
        public
        onlyAdmin
        nonReentrant
    {
        require(depositor != address(0), "depositor cannot be 0");
        require(
            depositor != GUILD && depositor != TOTAL,
            "depositor address cannot be reserved"
        );
        _submitDeposit(depositor, tributeOffered);
    }

    function _submitDeposit(address depositor, uint256 tributeOffered)
        internal
    {
        // collect tribute from depositor and store it in the Moloch Vault
        require(
            IERC20(depositToken).transferFrom(
                depositor,
                address(this),
                tributeOffered
            ),
            "tribute token transfer failed"
        );
        unsafeAddToBalance(depositor, tributeOffered);
        if (!EnumerableSet.contains(members, depositor)) {
            EnumerableSet.add(members, depositor);
        }
        emit SubmitDeposit(depositor, tributeOffered);
    }

    function withdrawBalance(address accountHolder, uint256 amount)
        public
        nonReentrant
    {
        _withdrawBalance(accountHolder, amount);
    }

    function _withdrawBalance(address accountHolder, uint256 amount)
        internal
        onlyAdmin
    {
        require(
            userTokenBalances[accountHolder] >= amount,
            "insufficient balance"
        );
        unsafeSubtractFromBalance(accountHolder, amount);
        require(
            IERC20(depositToken).transfer(accountHolder, amount),
            "transfer failed"
        );
        emit Withdraw(accountHolder, amount);
    }

    function storeInVault(address accountHolder, uint256 amount)
        public
        nonReentrant
    {
        _storeInVault(accountHolder, amount);
    }

    function storeTokensInVault(address accountHolder, uint256 amount, bool max)
        internal
        nonReentrant
    {
        uint256 storeAmount = amount;
        if (max) {
            // store the maximum balance
            storeAmount = userTokenBalances[msg.sender];
        }
        _storeInVault(accountHolder, storeAmount);
    }

    function _storeInVault(address accountHolder, uint256 amount) internal {
        require(
            userTokenBalances[accountHolder] >= amount,
            "insufficient balance"
        );
        unsafeInternalTransfer(accountHolder, GUILD, amount);
        emit TokensStored(accountHolder, amount);
    }

    function collectTokens() public nonReentrant {
        uint256 amountToCollect = IERC20(depositToken)
            .balanceOf(address(this))
            .sub(userTokenBalances[TOTAL]);
        // only collect if 1) there are tokens to collect 2) token is whitelisted 3) token has non-zero balance
        require(amountToCollect > 0, "no tokens to collect");

        unsafeAddToBalance(GUILD, amountToCollect);
        emit TokensCollected(amountToCollect);
    }

    /***************
    GETTER FUNCTIONS
    ***************/

    function max(uint256 x, uint256 y) internal pure returns (uint256) {
        return x >= y ? x : y;
    }

    function getUserTokenBalance(address user)
        public
        view
        returns (uint256)
    {
        return userTokenBalances[user];
    }

    /***************
    HELPER FUNCTIONS
    ***************/
    function unsafeAddToBalance(address user, uint256 amount) internal {
        userTokenBalances[user] += amount;
        userTokenBalances[TOTAL] += amount;
    }

    function unsafeSubtractFromBalance(address user, uint256 amount) internal {
        userTokenBalances[user] -= amount;
        userTokenBalances[TOTAL] -= amount;
    }

    function unsafeInternalTransfer(address from, address to, uint256 amount)
        internal
    {
        unsafeSubtractFromBalance(from, amount);
        unsafeAddToBalance(to, amount);
    }

    /***************
     ESCAPE HATCH
    ***************/

    address public escapeHatchDestination;

    /// @notice The `escapeHatch()` should only be called as a last resort if a
    /// security issue is uncovered or something unexpected happened
    function escapeHatch() public onlyAdmin {
        uint256 total = IERC20(depositToken).balanceOf(address(this));

        require(
            IERC20(depositToken).transfer(escapeHatchDestination, total),
            "tribute token transfer failed"
        );

        emit EscapeHatchCalled(total);
    }

    /// @notice Changes the address assigned to call `escapeHatch()`
    /// @param _newEscapeHatchCaller The address of a trusted account or contract to
    ///  call `escapeHatch()` to send the ether in this contract to the
    ///  `escapeHatchDestination` it would be ideal that `escapeHatchCaller` cannot
    ///  move funds out of `escapeHatchDestination`
    function changeEscapeCaller(address _newEscapeHatchCaller) public {
        //escapeHatchCaller = _newEscapeHatchCaller;
    }

    event EscapeHatchCalled(uint256 amount);
}
