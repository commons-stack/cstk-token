pragma solidity ^0.5.17;


interface ITokenBank {
    function deposit(address _address, uint256 _amount) external;

    function withdraw(address _address, uint256 _amount) external;

    function storeInVault(address _address, uint256 _amount) external;

    function storeAllInVault() external;

    function storeUnclaimedInVault() external;

    function drainVault() external;

    function getDepositToken() external view returns (address);

    function getTokenBalance(address _address) external view returns (uint256);

    function isAccount(address _address) external view returns (bool);

    function numAccounts() external view returns (uint256);

    function getAccounts() external view returns (address[] memory);

    function getAccountsAndTokenBalances()
        external
        view
        returns (address[] memory, uint256[] memory);

    function unclaimedTokenBalance() external view returns (uint256);
}
