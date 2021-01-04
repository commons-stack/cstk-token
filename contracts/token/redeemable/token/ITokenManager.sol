pragma solidity ^0.5;

// https://etherscan.io/address/0xde3a93028f2283cc28756b3674bd657eafb992f4#code

interface ITokenManager {
    /**
     * @notice Mint `@tokenAmount(self.token(): address, _amount, false)` tokens for `_receiver`
     * @param _receiver The address receiving the tokens, cannot be the Token Manager itself (use `issue()` instead)
     * @param _amount Number of tokens minted
     */
    function mint(address _receiver, uint256 _amount) external;
}
