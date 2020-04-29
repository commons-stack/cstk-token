pragma solidity >=0.5.0 <0.7.0;


/// https://github.com/gnosis/safe-contracts/blob/v1.1.1/contracts/common/SecuredTokenTransfer.sol

/// @title SecuredTokenTransfer - Secure token transfer
/// @author Richard Meissner - <richard@gnosis.pm>
contract SecuredTokenTransfer {
    /// @dev Transfers a token and returns if it was a success
    /// @param token Token that should be transferred
    /// @param receiver Receiver to whom the token should be transferred
    /// @param amount The amount of tokens that should be transferred
    function transferToken(address token, address receiver, uint256 amount)
        internal
        returns (bool transferred);
}
