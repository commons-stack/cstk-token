pragma solidity ^0.5.0;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/access/Roles.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";


/**
 * @title AdminRole
 * @dev Admins are responsible for assigning and removing contributors.
 */
contract AdminRole is Context, Ownable {
    using Roles for Roles.Role;

    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);

    Roles.Role private _admins;

    /**
     * @dev Initialize contract with an list of admins.
     * Deployer address is an admin by default.
     * @param accounts An optional list of admin addresses.
     */
    constructor(address[] memory accounts) internal {
        // Add the deployer account as admin:
        _addAdmin(_msgSender());
        emit AdminAdded(_msgSender());

        // Add all accounts from the list of other admins:
        for (uint256 i = 0; i < accounts.length; ++i) {
            // We skip the deployer account to avoid deployment errors.
            if (accounts[i] != _msgSender()) {
                _addAdmin(accounts[i]);
                emit AdminAdded(accounts[i]);
            }
        }
    }

    modifier onlyAdmin() {
        require(
            isAdmin(_msgSender()),
            "AdminRole: caller does not have the Admin role"
        );
        _;
    }

    /**
     * @dev Check if address has the Admin role on the contract.
     * @param account The address being checked
     * @return True, if it has the Admin role
     */
    function isAdmin(address account) public view returns (bool) {
        return _admins.has(account);
    }

    /**
     * @dev Add the Admin role to an address. Can only be called by an Admin.
     * @param account The address to receive Admin role
     */
    function addAdmin(address account) public onlyAdmin {
        _addAdmin(account);
    }

    /**
     * @dev Remove the admin role from the caller. Can only be called by an Admin.
     */
    function renounceAdmin() public onlyAdmin {
        _removeAdmin(_msgSender());
    }

    /**
     * @dev Remove the admin role from an admin account. Can only be called by the Owner.
     * @param account The address t
     */
    function removeAdmin(address account) public onlyOwner {
        _removeAdmin(account);
    }

    function _addAdmin(address account) internal {
        _admins.add(account);
        emit AdminAdded(account);
    }

    function _removeAdmin(address account) internal {
        _admins.remove(account);
        emit AdminRemoved(account);
    }
}
