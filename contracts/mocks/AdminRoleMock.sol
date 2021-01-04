pragma solidity ^0.5.0;

import "../registry/AdminRole.sol";


contract AdminRoleMock is AdminRole {
    constructor(address[] memory accounts) public AdminRole(accounts) {}
}
