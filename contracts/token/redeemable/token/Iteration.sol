pragma solidity ^0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";

// TODO; set soft cap on iteration

library Iteration {
    //
    // STRUCT DECLARATIONS:
    //

    /// @dev Entry represents a single iteration.
    struct Entry {
        uint256 numerator; /// @dev Multiplication factor
        uint256 denominator; /// @dev Multiplication factor
        uint256 softCap; /// @dev Soft cap (in DAI)
        uint256 hardCap; /// @dev Hard cap (in DAI)
        uint256 startBlock; /// @dev Block when iteration started (0 for not started)
        uint256 softCapTimestamp; /// @dev Block when soft cap was reached (0 if not reached)
        uint256 totalReceived; /// @dev Total DAI received
    }

    /// @dev List is a list of iterations.
    struct List {
        mapping(uint16 => Entry) values;
        uint16 cnt;
        uint16 cur;
    }

    //
    // FUNCTIONS:
    //

    /// @dev Add a new entry to a list of iterations.
    /// @param _list (List storage) - Pointer to a List
    /// @param _numerator (uit256) - Numerator
    /// @param _denominator (uint256) - Denominator
    /// @param _softCap (uint256) - Soft Cap
    /// @param _hardCap (uiny256) - Hard Cap
    function add(
        List storage _list,
        uint256 _numerator,
        uint256 _denominator,
        uint256 _softCap,
        uint256 _hardCap
    ) internal {
        uint16 id = _list.cnt;
        _list.values[id] = Entry(
            _numerator,
            _denominator,
            _softCap,
            _hardCap,
            0,
            0,
            0
        );
        _list.cnt++;
    }

    /// @dev Start the fist iteration in the list.
    /// Set the startBlock of the fist iteration to the current block number.
    /// @param _list (List storage) - Pointer to a List
    /// @param _blockNumber (uint256) - Current block number
    function startFirst(List storage _list, uint256 _blockNumber) internal {
        require(_list.cnt >= 1, "No iterations added");
        _list.values[0].startBlock = _blockNumber;
    }

    /// @dev Switch the current iteration to the next one in the list.
    /// @param _list (List storage) - Pointer to a List
    /// @param _blockNum (uint256) - Current block number
    function next(List storage _list, uint256 _blockNum) internal {
        require(_list.cur + 1 < _list.cnt, "No next iteration");
        _list.cur++;
        _list.values[_list.cur].startBlock = _blockNum;
    }

    /// @dev Add DAI to the total received amount of the iteration with the given order number.
    /// @param _list (List storage) - Pointer to a List
    /// @param _num (uint16) - Order number of an iteration
    /// @param _amt (uint256) - Amount to add
    function addDAI(
        List storage _list,
        uint16 _num,
        uint256 _amt
    ) internal {
        _list.values[_num].totalReceived = SafeMath.add(
            _list.values[_num].totalReceived,
            _amt
        );
    }

    /// @dev Substract DAI from the total received amount of the iteration with the given order number.
    /// @param _list (List storage) - Pointer to a List
    /// @param _num (uint16) - Order number of an iteration
    /// @param _amt (uint256) - Amount to substract
    function subDAI(
        List storage _list,
        uint16 _num,
        uint256 _amt
    ) internal {
        _list.values[_num].totalReceived = SafeMath.sub(
            _list.values[_num].totalReceived,
            _amt
        );
    }

    /// @dev Return the order number of the current active iteration, if there is an active iteration.
    /// If there are no active iterations, first return value is false.
    /// @param _list (List storage) - Pointer to a List
    /// @return ok (bool) - True if num is the current iteration
    /// @return num (uint16) - Order number of the current iteration
    function currentIteration(List storage _list)
        internal
        view
        returns (bool ok, uint16 num)
    {
        num = _list.cur;
        ok = _list.values[num].startBlock != 0;
        return (ok, num);
    }

    /// @dev Return if an iteration with the given number is active.
    /// @param _list (List storage) - Ptr to a List
    /// @param _num (uint16) - Order number of an iteration
    /// @return (bool ok) - True if itearation is active
    function isActive(List storage _list, uint16 _num)
        internal
        view
        returns (bool ok)
    {
        return _list.values[_num].startBlock != 0;
    }

    /// @dev Check if the iteration num has reached it's soft cap.
    /// @param _list (List storage) - Pointer to a List
    /// @param _num (uint8) - Order number of an iteration
    /// @return ok (bool) - True if iteration reached soft cap
    function reachedSoftCap(List storage _list, uint16 _num)
        internal
        view
        returns (bool ok)
    {
        return _list.values[_num].softCapTimestamp > 0;
    }

    // /// @dev Check if the current iteration has reached it's soft cap.
    // /// @param _list (List storage) - Pointer to a List
    // /// @return ok (bool) - True if iteration reached soft cap
    // function reachedSoftCap(List storage _list)
    //     internal
    //     view
    //     returns (bool ok)
    // {
    //     return reachedSoftCap(_list, _list.cur);
    // }

    /// @dev Get the total DAI received by the iteration with the given order number.
    /// @param _list (List storage) - Pointer to a List
    /// @param _num (uint8) - Order number of an iteration
    /// @return amt (uint256) - Amount of DAI received
    function totalReceived(List storage _list, uint16 _num)
        internal
        view
        returns (uint256 amt)
    {
        return _list.values[_num].totalReceived;
    }

    // /// @dev Get the total DAI received by the current iteration.
    // /// @param _list (List storage) - Pointer to a List
    // /// @return amt (uint256) - Amount of DAI received
    // function totalReceived(List storage _list)
    //     internal
    //     view
    //     returns (uint256 amt)
    // {
    //     return totalReceived(_list, _list.cur);
    // }

    /// @dev Get the multiplication factors of an iteration with a given order number.
    /// @param _list (List storage) - Pointer to a List
    /// @param _num (uint16) - Order number of an iteration
    /// @return numerator (uint256) - Numerator factor
    /// @return denominator (uint256) - Denominator factor
    function mf(List storage _list, uint16 _num)
        internal
        view
        returns (uint256 numerator, uint256 denominator)
    {
        numerator = _list.values[_num].numerator;
        denominator = _list.values[_num].denominator;
        return (numerator, denominator);
    }

    // /// @dev Get the multiplication factors of the current iteration.
    // /// @return numerator (uint256) - Numerator factor
    // /// @return denominator (uint256) - Denominator factor
    // function mf(List storage _list)
    //     internal
    //     view
    //     returns (uint256 nominator, uint256 denominator)
    // {
    //     return mf(_list, _list.cur);
    // }
}
