pragma solidity ^0.5.0;

import "./AdminRole.sol";


contract RegistryAbstract is AdminRole {
    constructor(address[] memory _admins) internal AdminRole(_admins) {}

    event ContributorAdded(address wallet);
    event ContributorRemoved(address wallet);

    struct ContributorInfo {
        address wallet;
        uint256 allowed;
        bool active;
    }

    /// @notice Register a list of contributors and the amount of CSTK token they are allowed to own.
    /// @dev wallets and allowed need to be in the same order
    /// @param wallets (address[]) List of contributors' addresses to be registered
    /// @param allowed (uint256[]) List of allowed amounts for each contributors.
    function registerContributors(
        address[] memory wallets,
        uint256[] memory allowed
    ) public;

    /// @notice Remove contributors from the registry.
    /// @param wallets (address[]) List of contributors to be removed.
    function removeContributors(address[] memory wallets) public;

    /// @param wallet (address)
    /// @return allowed (uint256) returns the amount of CSTK token that `wallet` is allowed to own.
    function getAllowed(address wallet) public view returns (uint256 allowed);

    /// @param wallet (address)
    /// @return TRUE if `wallet` is a contributor.
    function isContributor(address wallet) public view returns (bool);
}
