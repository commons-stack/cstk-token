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

    constructor(address[] memory admins) internal {
        _addAdmin(_msgSender());
        emit AdminAdded(_msgSender());
        for (uint256 i = 0; i < admins.length; ++i) {
            _addAdmin(admins[i]);
            emit AdminAdded(admins[i]);
        }
    }

    modifier onlyAdmin() {
        require(
            isAdmin(_msgSender()),
            "AdminRole: caller does not have the Admin role"
        );
        _;
    }

    function isAdmin(address account) public view returns (bool) {
        return _admins.has(account);
    }

    function addAdmin(address account) public onlyAdmin {
        _addAdmin(account);
    }

    function renounceAdmin() public onlyAdmin {
        _removeAdmin(_msgSender());
    }

    function removeAdmin(address wallet) public onlyOwner {
        _removeAdmin(wallet);
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
