pragma solidity ^0.5.17;

interface IMintable {
    function mint(address _who, uint256 _value) external;
}
