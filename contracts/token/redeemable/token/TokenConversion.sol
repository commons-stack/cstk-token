pragma solidity ^0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";

library TokenConversion {
    struct Ratio {
        uint256 n; /// @dev Numerator
        uint256 d; /// @dev Denominator
    }

    /// @dev Convert a given amount of DAI to tokens with safety checks.
    /// @param _ratio (Ratio memory) - Ratio of conversion
    /// @param _amt (uint256) - Amount of DAI to convert
    /// @return tokens (uint256) - Amount of tokens
    function toTokens(Ratio memory _ratio, uint256 _amt)
        internal
        pure
        returns (uint256 tokens)
    {
        return SafeMath.div(SafeMath.mul(_amt, _ratio.n), _ratio.d);
    }

    /// @dev Convert a given amount of tokens to DAI with safety checks.
    /// @param _ratio (MF memory) - Ratio of coversion
    /// @param _amt (uint256) - Amount of tokens to convert
    /// @return dai (uint256) - Amount of DAI
    function toDAI(Ratio memory _ratio, uint256 _amt)
        internal
        pure
        returns (uint256 dai)
    {
        return SafeMath.div(SafeMath.mul(_amt, _ratio.d), _ratio.n);
    }
}
