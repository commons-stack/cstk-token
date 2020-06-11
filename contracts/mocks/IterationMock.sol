pragma solidity ^0.5.17;

import "../token/redeemable/token/IterationList.sol";

contract IterationMock {
    using IterationList for IterationList.Data;

    IterationList.Data private list;

    event OperationResult(uint256 result);

    function add(
        uint256 _numerator,
        uint256 _denominator,
        uint256 _softCap,
        uint256 _hardCap
    ) external {
        list.add(_numerator, _denominator, _softCap, _hardCap);
    }

    function startFirst(uint256 _blockNumber) external {
        list.startFirst(_blockNumber);
    }

    function next(uint256 _blockNumber) external {
        list.next(_blockNumber);
    }

    function contribute(uint256 _amt, uint256 _timestamp) external {
        uint256 diff = list.contribute(_amt, _timestamp);
        emit OperationResult(diff);
    }

    function redeem(uint256 _amt) external {
        list.redeem(_amt);
    }

    function currentIteration() external view returns (bool ok, uint16 num) {
        return list.currentIteration();
    }

    function cnt() external view returns (uint256 num) {
        return list.cnt;
    }

    function isActive(uint16 _num) external view returns (bool ok) {
        return list.isActive(_num);
    }

    function softCapTimestamp() external view returns (uint256 timestamp) {
        return list.softCapTimestamp();
    }

    function totalReceived() external view returns (uint256 amt) {
        return list.totalReceived();
    }

    function conversionRatio()
        external
        view
        returns (uint256 numerator, uint256 denominator)
    {
        return list.conversionRatio();
    }
}
