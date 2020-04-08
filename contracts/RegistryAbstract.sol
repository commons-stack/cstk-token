pragma solidity ^0.5.0;

import "./AdminRole.sol";


contract RegistryAbstract is AdminRole {
    constructor(address[] memory _admins) AdminRole(_admins) internal {}

    event ContributorAdded(address wallet);
    event ContributorRemoved(address wallet);

    struct ContributorInfo {
        address wallet;
        uint256 allowed;
        bool active;
    }

    function registerContributors(address[] memory wallets, uint256[] memory allowed) public;

    function removeContributors(address[] memory wallets) public;

    function getAllowed(address wallet) public view returns (uint256 allowed);

    function isContributor(address wallet) public view returns (bool);
}
