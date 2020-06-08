pragma solidity ^0.5.17;

import "../token/redeemable/token/Iteration.sol";

contract IterationMock {
    using Iteration for Iteration.List;

    Iteration.List private list;

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

    function addDAI(uint16 _num, uint256 _amt) external {
        list.addDAI(_num, _amt);
    }

    function subDAI(uint16 _num, uint256 _amt) external {
        list.subDAI(_num, _amt);
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

    function reachedSoftCap(uint16 _num) external view returns (bool ok) {
        return list.reachedSoftCap(_num);
    }

    function totalReceived(uint16 _num) external view returns (uint256 amt) {
        return list.totalReceived(_num);
    }

    function mf(uint16 num)
        external
        view
        returns (uint256 numerator, uint256 denominator)
    {
        return list.mf(num);
    }
}
