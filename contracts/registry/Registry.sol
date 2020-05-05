pragma solidity ^0.5.0;

import "./RegistryAbstract.sol";


/// @title Registry to whitelist contributors
/// @author Nelson Melina
/// @notice
/// @dev
contract Registry is RegistryAbstract {
    /// @notice
    mapping(address => ContributorInfo) contributors;

    /// @notice
    /// @dev
    /// @param _admins ()
    constructor(address[] memory _admins) public RegistryAbstract(_admins) {}

    function registerContributors(
        address[] memory wallets,
        uint256[] memory allowed
    ) public {
        _registerContributors(wallets, allowed);
    }

    /// @notice
    /// @dev
    /// @param wallets ()
    /// @param allowed ()
    function _registerContributors(
        address[] memory wallets,
        uint256[] memory allowed
    ) internal {
        require(
            wallets.length == allowed.length,
            "wallets and allowed values need to be the same length"
        );
        for (uint256 i = 0; i < wallets.length; ++i) {
            require(wallets[i] != address(0), "address cannot be address(0)");
            ContributorInfo memory newContributor = ContributorInfo(
                wallets[i],
                allowed[i],
                true
            );
            contributors[newContributor.wallet] = newContributor;
            emit ContributorAdded(newContributor.wallet);
        }
    }

    /// @notice
    /// @dev
    /// @param wallets ()
    function removeContributors(address[] memory wallets) public {
        _removeContributors(wallets);
    }

    function _removeContributors(address[] memory wallets) internal onlyAdmin {
        for (uint256 i = 0; i < wallets.length; ++i) {
            require(wallets[i] != address(0), "Cannot be zero address");
            delete contributors[wallets[i]].wallet;
            delete contributors[wallets[i]].allowed;
            delete contributors[wallets[i]].active;
            delete contributors[wallets[i]];
            emit ContributorRemoved(wallets[i]);
        }
    }

    /// @notice
    /// @dev
    /// @param wallet (address)
    /// @return allowed (uint256)
    function getAllowed(address wallet) public view returns (uint256 allowed) {
        return contributors[wallet].allowed;
    }

    function isContributor(address wallet) public view returns (bool) {
        return contributors[wallet].active;
    }
}

