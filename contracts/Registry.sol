pragma solidity ^0.5.0;

import "./RegistryAbstract.sol";


contract Registry is RegistryAbstract {
    mapping(address => ContributorInfo) contributors;

    constructor(address[] memory _admins) public RegistryAbstract(_admins) {}

    function registerContributors(
        address[] memory wallets,
        uint256[] memory allowed
    ) public {
        return _registerContributors(wallets, allowed);
    }

    function _registerContributors(
        address[] memory wallets,
        uint256[] memory allowed
    ) internal {
        require(
            wallets.length == allowed.length,
            "wallets and allowed values need to be the same length"
        );
        for (uint256 i = 0; i < wallets.length; ++i) {
            require(wallets[i] != address(0), "address can not be address(0)");
            ContributorInfo memory newContributor = ContributorInfo(
                wallets[i],
                allowed[i],
                true
            );
            contributors[newContributor.wallet] = newContributor;
            emit ContributorAdded(newContributor.wallet);
        }
    }

    function removeContributors(address[] memory wallets) public onlyAdmin {
        _removeContributors(wallets);
    }

    function _removeContributors(address[] memory wallets) internal {
        for (uint256 i = 0; i < wallets.length; ++i) {
            require(wallets[i] != address(0), "address can not be address(0)");
            delete contributors[wallets[i]].wallet;
            delete contributors[wallets[i]].allowed;
            delete contributors[wallets[i]].active;
            delete contributors[wallets[i]];
            emit ContributorRemoved(wallets[i]);
        }
    }

    function getAllowed(address wallet) public view returns (uint256 allowed) {
        return contributors[wallet].allowed;
    }

    function isContributor(address wallet) public view returns (bool) {
        return contributors[wallet].active;
    }
}
