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

    // TODO: Better to use a dedicated vault counter?
    address public constant VAULT = address(0xdead);

    // TODO: Better to use a dedicated total counter?
    address public constant TOTAL = address(0xbabe);

    //
    // STORAGE:
    //

    // Address of the ERC20 token contract that stores tokens in the TokenBank:
    address public token;

    // EnumerableSet of all accounts that have a balance in the TokenBank:
    EnumerableSet.AddressSet internal accounts;

    // Mapping of account => token balance in the TokenBank:
    mapping(address => uint256) public tokenBalances;

    // Address to evacuate tokens to on evacuate calls, set on construction:
    address public evacuationDestination;

    //
    // EVENTS:
    //

    /// @dev Emit when a deposit is submitted to the TokenBank:
    event SubmitDeposit(address indexed depositor, uint256 depositAmount);

    /// @dev Emit when the TokenBank moves an amount of tokens to the Vault:
    event TokensStoredInVault(address indexed account, uint256 amount);

    /// @dev Emit when an amount of tokens has been collected:
    event TokensCollected(uint256 amountToCollect);

    /// @dev Emit when an amount of tokens has been withdrawn to an account:
    event Withdraw(address indexed account, uint256 amount);

    /// @dev Emit when an amount of tokens has been evacuated to a destination:
    event Evacuate(address indexed destination, uint256 amount);

    /// @dev Only allow addresses from the account holders set
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

    /// @dev Construct a TokenBank.
    /// @param _token The ERC20 token that the TokenBank can receive
    /// @param _admins A list of addresses that will be given the Admin role
    /// @param _evacuationDestination The address to receive evacuated tokens
    /// @param _escapeHatchCaller The address allowed to call the EscapeHatch
    /// @param _escapeHatchDestination The address to receive all tokens from calling the EscapeHatch
    constructor(
        address _token,
        address[] memory _admins,
        address _evacuationDestination,
        address _escapeHatchCaller,
        address payable _escapeHatchDestination
    )
        public
        AdminRole(_admins)
        Escapable(_escapeHatchCaller, _escapeHatchDestination)
    {
        // TODO: Verify that token has ERC20 interface?
        require(token != address(0), "Deposit token address cannot be zero");

        token = _token;
        evacuationDestination = _evacuationDestination;
    }

    //
    // PUBLIC FUNCTIONS:
    //

    function submitDeposit(address _address, uint256 _amount)
        public
        onlyAdmin
        nonReentrant
    {
        require(_address != address(0), "Depositor address cannot be zero");
        require(
            _address != VAULT && _address != TOTAL,
            "Depositor address cannot be a reserved value"
        );

        // Take a deposit of tokens from the depositor and transfer it to TokenBank:
        require(
            IERC20(token).transferFrom(_address, address(this), _amount),
            "Token transfer failed"
        );
        // Add deposited amount to the depositor token balance:
        unsafeAddToBalance(_address, _amount);

        // Ensure depositor is in the account set:
        if (!EnumerableSet.contains(accounts, _address)) {
            EnumerableSet.add(accounts, _address);
        }

        emit SubmitDeposit(_address, _amount);
    }

    function withdrawFromBalance(address _address, uint256 _amount)
        public
        onlyAdmin
        nonReentrant
    {
        require(
            tokenBalances[_address] >= _amount,
            "Address has insufficieant token balance to withdraw"
        );

        // Remove the amount of tokens the account token balance:
        unsafeSubtractFromBalance(_address, _amount);

        // Transfer the token amount fro TokenBank to address:
        require(
            IERC20(token).transfer(_address, _amount),
            "Token transfer failed"
        );

        emit Withdraw(_address, _amount);
    }

    function storeInVault(address _address, uint256 _amount)
        public
        onlyAdmin
        nonReentrant
    {
        require(
            tokenBalances[_address] >= _amount,
            "Address has insufficient token balance balance to send to Vault"
        );

        // Move the tokens from the token account to the Vault:
        unsafeInternalTransfer(_address, VAULT, _amount);

        emit TokensStoredInVault(_address, _amount);
    }

    function storeAllInVault() public onlyAdmin nonReentrant {
        // Get an enumerated array of all accounts:
        address[] memory accs = EnumerableSet.enumerate(accounts);

        // For each account:
        for (uint256 i = 0; i < accs.length; ++i) {
            address acc = accs[i];
            uint256 bal = tokenBalances[acc];

            // Move the tokens from the token account to the Vault:
            unsafeInternalTransfer(acc, VAULT, bal);

            emit TokensStoredInVault(acc, bal);
        }
    }

    function evacuateToDestination()
        public
        onlyAdmin
        nonReentrant
    {
        uint256 vaultBalance = tokenBalances[VAULT];

        // Remove all the tokens from Vault:
        unsafeSubtractFromBalance(VAULT, vaultBalance);

        // Transfer all the tokens from the TokenBank to the evac address:
        require(
            IERC20(token).transfer(evacuationDestination, vaultBalance),
            "Transfer failed"
        );

        emit Evacuate(evacuationDestination, vaultBalance);
    }

    function collectTokens() public nonReentrant {
        // Fist, get the total token balance of the TokenVault contract:
        uint256 balance = IERC20(token).balanceOf(address(this));

        // Amount of tokens to collect is the remainder of unallocated tokens:
        // TODO: extract getTokensToCollect to view function?
        uint256 toCollect = SafeMath.sub(balance, tokenBalances[TOTAL]);

        require(toCollect > 0, "No token balance to collect");

        // Add all unallocated tokens to the Vault:
        unsafeAddToBalance(VAULT, toCollect);

        emit TokensCollected(toCollect);
    }

    //
    // VIEW FUNCTIONS:
    //

    // TODO: Extract getTokensToCollect into view function?
    // TODO: Add account functions: isAccount, getAccounts?

    function getUserTokenBalance(address _address)
        public
        view
        returns (uint256)
    {
        return tokenBalances[_address];
    }

    //
    // INTERNAL FUNCTIONS:
    //

    // TODO: Aren't these SAFE adds and transfers?

    function unsafeAddToBalance(address _account, uint256 _amount) internal {
        tokenBalances[_account] = SafeMath.add(
            tokenBalances[_account],
            _amount
        );
        // TODO: Use dedicated total counter instead?
        tokenBalances[TOTAL] = SafeMath.add(tokenBalances[TOTAL], _amount);
    }

    function unsafeSubtractFromBalance(address _account, uint256 _amount)
        internal
    {
        tokenBalances[_account] = SafeMath.sub(
            tokenBalances[_account],
            _amount
        );
        // TODO: Use dedicated total counter instead?
        tokenBalances[TOTAL] = SafeMath.sub(tokenBalances[TOTAL], _amount);
    }

    function unsafeInternalTransfer(
        address from,
        address to,
        uint256 amount
    ) internal {
        unsafeSubtractFromBalance(from, amount);
        unsafeAddToBalance(to, amount);
    }
}
