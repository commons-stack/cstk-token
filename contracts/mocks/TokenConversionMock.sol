pragma solidity ^0.5.17;

import "../token/redeemable/token/TokenConversion.sol";

contract TokenConversionMock {
    using TokenConversion for TokenConversion.Ratio;

    TokenConversion.Ratio private ratio;

    function setRatio(uint256 _numerator, uint256 _denominator) external {
        ratio.n = _numerator;
        ratio.d = _denominator;
    }

    function toDAI(uint256 _amt) external view returns (uint256) {
        return ratio.toDAI(_amt);
    }

    function toTokens(uint256 _amt) external view returns (uint256) {
        return ratio.toTokens(_amt);
    }
}
