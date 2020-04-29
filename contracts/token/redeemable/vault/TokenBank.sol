pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Escapable.sol";


contract TokenBank is ReentrancyGuard, Ownable, Escapable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /***************
    GLOBAL CONSTANTS
    ***************/
    address public depositToken; // deposit token contract reference; example : DAI

    // ***************
    // EVENTS
    // ***************
    event SubmitDeposit(address indexed depositor, uint256 depositAmount);

    event TokensStoredInVault(
        address indexed memberAddress,
        uint256 amountStored
    );

    event TokensCollected(uint256 amountToCollect);

    event Withdraw(address indexed memberAddress, uint256 amount);

    event Evacuate(uint256 amount, address indexed destination);

    // *******************
    // INTERNAL ACCOUNTING
    // *******************

    address public constant VAULT = address(0xdead);
    address public constant TOTAL = address(0xbabe);

    address public evacuationDestination;

    mapping(address => uint256) public userTokenBalances;

    EnumerableSet.AddressSet internal accountHolders;

    modifier onlyAccountHolders(address wallet) {
        require(EnumerableSet.contains(accountHolders, wallet), "not a member");
        _;
    }

    constructor(
        address _depositToken,
        address[] memory _admins,
        address _evacuationDestination,
        address _escapeHatchCaller,
        address _escapeHatchDestination
    )
        public
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        require(_depositToken != address(0), "summoner cannot be 0");
        // TODO verify that token is ERC20 too ?
        depositToken = _depositToken;
        evacuationDestination = _evacuationDestination;
    }

    /*****************
    DEPOSIT FUNCTIONS
    *****************/
    function submitDeposit(address depositor, uint256 depositAmount)
        public
        onlyAdmin
        nonReentrant
        returns (bool)
    {
        require(depositor != address(0), "depositor cannot be address(0)");
        require(
            depositor != VAULT && depositor != TOTAL,
            "depositor address cannot be reserved"
        );
        // collect tribute from depositor and store it in the Bank...
        require(
            IERC20(depositToken).transferFrom(
                depositor,
                address(this),
                depositAmount
            ),
            "tribute token transfer failed"
        );
        // ...under their account name.
        unsafeAddToBalance(depositor, depositAmount);

        // Add them as an account holder if they don't exist yet.
        if (!EnumerableSet.contains(accountHolders, depositor)) {
            EnumerableSet.add(accountHolders, depositor);
        }
        emit SubmitDeposit(depositor, depositAmount);
        return true;
    }

    function withdrawFromBalance(address accountHolder, uint256 amount)
        public
        onlyAdmin
        nonReentrant
        returns (bool)
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
        return true;
    }

    function storeInVault(address accountHolder, uint256 amount)
        public
        onlyAdmin
        nonReentrant
        returns (bool)
    {
        require(
            userTokenBalances[accountHolder] >= amount,
            "insufficient balance"
        );
        unsafeInternalTransfer(accountHolder, VAULT, amount);
        emit TokensStored(accountHolder, amount);
        return true;
    }

    function storeAllInVault() public onlyAdmin nonReentrant returns (bool) {
        EnumerableSet _accountHolders = EnumerableSet.enumerate(accountHolders);
        for (var index = 0; index < _accountHolders.length; index++) {
            unsafeInternalTransfer(
                _accountHolders[index],
                VAULT,
                userTokenBalances[_accountHolders[index]]
            );
            emit TokensStored(
                _accountHolders[index],
                userTokenBalances[_accountHolders[index]]
            );
        }
        return true;
    }

    function evacuateToDestination()
        public
        onlyAdmin
        nonReentrant
        returns (bool)
    {
        uint256 amount = userTokenBalances[VAULT];
        require(
            IERC20(depositToken).transfer(evacuationDestination, amount),
            "transfer failed"
        );
        unsafeSubtractFromBalance(VAULT, amount);
        emit Evacuate(amount, evacuationDestination);
        return true;
    }

    function collectTokens(address) public nonReentrant returns (bool) {
        uint256 amountToCollect = IERC20(depositToken)
            .balanceOf(address(this))
            .sub(userTokenBalances[TOTAL]);
        require(amountToCollect > 0, "no tokens to collect");

        unsafeAddToBalance(VAULT, amountToCollect);
        emit TokensCollected(amountToCollect);
        return true;
    }

    /***************
    GETTER FUNCTIONS
    ***************/

    function getUserTokenBalance(address accountHolder)
        public
        view
        returns (uint256)
    {
        return userTokenBalances[accountHolder];
    }

    /***************
    HELPER FUNCTIONS
    ***************/
    function unsafeAddToBalance(address user, uint256 amount) internal {
        userTokenBalances[user] = SafeMath.add(userTokenBalances[user], amount);
        userTokenBalances[TOTAL] = SafeMath.add(
            userTokenBalances[TOTAL],
            amount
        );
    }

    function unsafeSubtractFromBalance(address user, uint256 amount) internal {
        userTokenBalances[user] = SafeMath.sub(userTokenBalances[user], amount);
        userTokenBalances[TOTAL] = SafeMath.sub(
            userTokenBalances[TOTAL],
            amount
        );
    }

    function unsafeInternalTransfer(address from, address to, uint256 amount)
        internal
    {
        unsafeSubtractFromBalance(from, amount);
        unsafeAddToBalance(to, amount);
    }
}
