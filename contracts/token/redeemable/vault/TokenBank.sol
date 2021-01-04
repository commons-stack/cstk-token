pragma solidity ^0.5.17;

import "./ReentrancyGuard.sol";
import "../Escapable.sol";
import "../../../registry/AdminRole.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract TokenBank is ReentrancyGuard, AdminRole, Escapable {
    using EnumerableSet for EnumerableSet.AddressSet;

    //
    // CONSTANTS:
    //

    address internal constant VAULT = address(0xdead);
    address internal constant TOTAL = address(0xbabe);

    //
    // STORAGE:
    //

    // Address of the ERC20 token contract that stores tokens in the TokenBank:
    address internal token;

    // EnumerableSet of all accounts that have a balance in the TokenBank:
    EnumerableSet.AddressSet internal accounts;

    // Mapping of account => token balance in the TokenBank:
    mapping(address => uint256) internal tokenBalances;

    // Address to receive vault drain, set on construction:
    address internal drainVaultReceiver;

    //
    // EVENTS:
    //

    /// @dev Emit when a deposit is submitted to the TokenBank:
    event Deposit(address indexed depositor, uint256 depositAmount);

    /// @dev Emit when the TokenBank moves an amount of tokens to the Vault:
    event StoredInVault(address indexed account, uint256 amount);

    /// @dev Emit when an amount of tokens has been collected:
    event StoreUnclaimedInVault(uint256 amountToCollect);

    /// @dev Emit when an amount of tokens has been withdrawn to an account:
    event Withdraw(address indexed account, uint256 amount);

    /// @dev Emit when an amount of tokens has been drained from the Vault:
    event DrainVault(address indexed destination, uint256 amount);

    /// @dev Only allow addresses from the account holders set:
    modifier onlyAccountHolders(address addr) {
        require(
            EnumerableSet.contains(accounts, addr),
            "Address is not an account holder"
        );
        _;
    }

    //
    // CONSTRUCTOR:
    //

    /// @notice Construct a TokenBank.
    /// @param _token The ERC20 token that the TokenBank can receive
    /// @param _admins A list of addresses that will be given the Admin role
    /// @param _drainVaultReceiver The address to receive Vault drains
    /// @param _escapeHatchCaller The address allowed to call the EscapeHatch
    /// @param _escapeHatchDestination The address to receive all tokens from calling the EscapeHatch
    constructor(
        address _token,
        address[] memory _admins,
        address _drainVaultReceiver,
        address _escapeHatchCaller,
        address payable _escapeHatchDestination
    )
        public
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        require(_token != address(0), "Deposit token cannot be zero adress");
        require(
            _drainVaultReceiver != address(0),
            "Vault cannot be drained to zero address"
        );

        token = _token;
        drainVaultReceiver = _drainVaultReceiver;
    }

    //
    // EXTERNAL FUNCTIONS:
    //

    /// @notice Deposit `amount` tokens on `wallet` account.
    function deposit(address wallet, uint256 amount)
        external
        onlyAdmin
        nonReentrant
    {
        require(wallet != address(0), "Cannot deposit from zero address");
        require(
            wallet != VAULT && wallet != TOTAL,
            "Cannot deposit from reserved address"
        );

        // Take a deposit of tokens from the depositor and transfer it to TokenBank:
        require(
            IERC20(token).transferFrom(wallet, address(this), amount),
            "Token transfer failed"
        );
        // Add deposited amount to the depositor token balance:
        _addToBalance(wallet, amount);

        // Ensure depositor is in the account set:
        if (!EnumerableSet.contains(accounts, wallet)) {
            EnumerableSet.add(accounts, wallet);
        }

        emit Deposit(wallet, amount);
    }

    /// @notice Withdraw `amount` from `wallet` account and send it back to it's address.
    function withdraw(address wallet, uint256 amount)
        external
        onlyAdmin
        nonReentrant
    {
        require(
            tokenBalances[wallet] >= amount,
            "Address has insufficieant token balance to withdraw"
        );

        // Remove the amount of tokens the account token balance:
        _subFromBalance(wallet, amount);

        // Transfer the token amount fro TokenBank to address:
        require(
            IERC20(token).transfer(wallet, amount),
            "Token transfer failed"
        );

        emit Withdraw(wallet, amount);
    }

    /// @notice Move `amount` tokens from `wallet` account to the VAULT account.
    function storeInVault(address wallet, uint256 amount)
        external
        onlyAdmin
        nonReentrant
        returns (uint256 amountStored)
    {
        if (amount < tokenBalances[wallet]) {
            amountStored = amount;
        } else {
            amountStored = tokenBalances[wallet];
        }
        // Move the tokens from the token account to the Vault:

        _internalTransfer(wallet, VAULT, amountStored);
        emit StoredInVault(wallet, amountStored);
        return amountStored;
    }

    /// @notice Move all tokens to the VAULT account.
    function storeAllInVault() external onlyAdmin nonReentrant {
        address[] memory accs = _getAccounts();
        for (uint256 i = 0; i < accs.length; ++i) {
            address acc = accs[i];
            uint256 bal = tokenBalances[acc];

            _internalTransfer(acc, VAULT, bal);
            emit StoredInVault(acc, bal);
        }
    }

    /// @notice Move tokens sent manually (to this smart contract) to the VAULT account.
    function storeUnclaimedInVault() external onlyAdmin nonReentrant {
        uint256 amount = _unclaimedTokenBalance();
        require(amount > 0, "No unclaimed token balance to store in Vault");

        // Add all unclaimed tokens to the Vault:
        _addToBalance(VAULT, amount);

        emit StoreUnclaimedInVault(amount);
    }

    /// @notice Remove all tokens attributed to VAULT account and transfer them to drainVaultReceiver address.
    function drainVault() external onlyAdmin nonReentrant {
        uint256 vaultBalance = tokenBalances[VAULT];

        // Remove all the tokens from Vault:
        _subFromBalance(VAULT, vaultBalance);

        // Transfer all the tokens from the TokenBank to the evac address:
        require(
            IERC20(token).transfer(drainVaultReceiver, vaultBalance),
            "Transfer failed"
        );

        emit DrainVault(drainVaultReceiver, vaultBalance);
    }

    //
    // VIEW FUNCTIONS:
    //

    function getDepositToken() external view returns (address) {
        return token;
    }

    function getTokenBalance(address wallet) external view returns (uint256) {
        return tokenBalances[wallet];
    }

    function isAccount(address wallet) external view returns (bool) {
        return accounts.contains(wallet);
    }

    function numAccounts() external view returns (uint256) {
        return accounts.length();
    }

    function getAccounts()
        external
        view
        returns (address[] memory accountsList)
    {
        return _getAccounts();
    }

    /// @dev getAccounts() implementation
    function _getAccounts()
        internal
        view
        returns (address[] memory accountsList)
    {
        return EnumerableSet.enumerate(accounts);
    }

    function getAccountsAndTokenBalances()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        uint256 len = accounts.length();
        address[] memory accs = _getAccounts();
        uint256[] memory balances = new uint256[](len);

        for (uint256 i = 0; i < len; ++i) {
            balances[i] = tokenBalances[accs[i]];
        }

        return (accs, balances);
    }

    /// @return the token balance not claimed by Vault or any account in the TokenBank
    function unclaimedTokenBalance() external view returns (uint256) {
        return _unclaimedTokenBalance();
    }

    /// @dev unclaimedTokenBalance() implementation
    function _unclaimedTokenBalance() internal view returns (uint256) {
        return
            SafeMath.sub(
                IERC20(token).balanceOf(address(this)),
                tokenBalances[TOTAL]
            );
    }

    //
    // INTERNAL FUNCTIONS:
    //

    function _addToBalance(address _account, uint256 amount) internal {
        tokenBalances[_account] = SafeMath.add(tokenBalances[_account], amount);
        tokenBalances[TOTAL] = SafeMath.add(tokenBalances[TOTAL], amount);
    }

    function _subFromBalance(address _account, uint256 amount) internal {
        tokenBalances[_account] = SafeMath.sub(tokenBalances[_account], amount);
        tokenBalances[TOTAL] = SafeMath.sub(tokenBalances[TOTAL], amount);
    }

    function _internalTransfer(
        address from,
        address to,
        uint256 amount
    ) internal {
        _subFromBalance(from, amount);
        _addToBalance(to, amount);
    }
}
