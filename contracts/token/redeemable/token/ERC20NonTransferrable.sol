pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ERC20NonTransferrable is ERC20 {
    function transfer(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }

    function approve(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public returns (bool) {
        revert("Token non transferrable");
    }

    function increaseAllowance(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }

    function decreaseAllowance(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }
}
