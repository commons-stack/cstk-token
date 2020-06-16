pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20NonTrasferrable is an ERC20 token implementation that reverts on transfers.
/// @author Commons Stack
/// @notice Transfer, approve, transferFrom, increaseAllowance and decreaseAllowance all revert.
/// This is mainly for interface compatibility.
contract ERC20NonTransferrable is ERC20 {
    /// @notice Transfer, always reverts.
    function transfer(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }

    /// @notice Approve, always reverts.
    function approve(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }

    /// @notice TransferFrom, always reverts.
    function transferFrom(
        address,
        address,
        uint256
    ) public returns (bool) {
        revert("Token non transferrable");
    }

    /// @notice increaseAllowance, always reverts.
    function increaseAllowance(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }

    /// @notice decreaseAllowance, always reverts.
    function decreaseAllowance(address, uint256) public returns (bool) {
        revert("Token non transferrable");
    }
}
