pragma solidity ^0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";

library IterationList {
    using SafeMath for uint256;

    //
    // STRUCT DECLARATIONS:
    //

    /// @dev Iteration represents a single iteration.
    struct Iteration {
        uint256 numerator; /// @dev Multiplication factor
        uint256 denominator; /// @dev Multiplication factor
        uint256 softCap; /// @dev Soft cap (in DAI)
        uint256 hardCap; /// @dev Hard cap (in DAI)
        uint256 startBlock; /// @dev Block when iteration started (0 for not started)
        uint256 softCapTimestamp; /// @dev Block when soft cap was reached (0 if not reached)
        uint256 totalReceived; /// @dev Total DAI received
    }

    /// @dev Data contains list data.
    struct Data {
        mapping(uint16 => Iteration) values;
        uint16 cnt;
        uint16 cur;
    }

    //
    // FUNCTIONS:
    //

    /// @dev Add a new entry to a list of iterations.
    /// @param _data (Data storage) - Pointer to list Data
    /// @param _numerator (uit256) - Numerator
    /// @param _denominator (uint256) - Denominator
    /// @param _softCap (uint256) - Soft Cap
    /// @param _hardCap (uiny256) - Hard Cap
    function add(
        Data storage _data,
        uint256 _numerator,
        uint256 _denominator,
        uint256 _softCap,
        uint256 _hardCap
    ) internal {
        require(_numerator != 0, "Numerator cannot be 0");
        require(_denominator != 0, "Denominator cannot be 0");
        require(_hardCap >= _softCap, "Hard cap cannot be less than soft cap");

        uint16 id = _data.cnt;
        _data.values[id] = Iteration(
            _numerator,
            _denominator,
            _softCap,
            _hardCap,
            0,
            0,
            0
        );
        _data.cnt++;
    }

    /// @dev Start the fist iteration in the list.
    /// Sets the startBlock of the fist iteration to the current block number.
    /// @param _data (Data storage) - Pointer to a Data
    /// @param _blockNumber (uint256) - Current block number
    function startFirst(Data storage _data, uint256 _blockNumber) internal {
        require(_data.cnt >= 1, "No iterations added");
        _data.values[0].startBlock = _blockNumber;
    }

    /// @dev Switch the current iteration to the next one in the list.
    /// @param _data (Data storage) - Pointer to list Data
    /// @param _blockNum (uint256) - Current block number
    function next(Data storage _data, uint256 _blockNum) internal {
        require(_data.cur + 1 < _data.cnt, "No next iteration");
        _data.cur++;
        _data.values[_data.cur].startBlock = _blockNum;
    }

    /// @dev Contribute to the total received amount of current iteration.
    /// @param _data (Data storage) - Pointer to list Data
    /// @param _amt (uint256) - Amount to add
    /// @param _timestamp (uint256) - Timestamp of the block
    /// @return hardCapDiff (uint256) - Amount added over the hard cap
    function contribute(
        Data storage _data,
        uint256 _amt,
        uint256 _timestamp
    ) internal returns (uint256 hardCapDiff) {
        Iteration storage cur = _data.values[_data.cur];
        require(cur.startBlock != 0, "Current iteration not active");
        require(cur.totalReceived < cur.hardCap, "Hard cap reached");

        uint256 diff = 0;
        cur.totalReceived = cur.totalReceived.add(_amt);
        if (cur.totalReceived > cur.softCap) {
            cur.softCapTimestamp = _timestamp;
        }
        if (cur.totalReceived > cur.hardCap) {
            diff = cur.totalReceived - cur.hardCap;
        }

        return diff;
    }

    /// @dev Redeem (substract) from the total received amount of the current iteration.
    /// Reverts if soft cap has been reached.
    /// @param _data (Data storage) - Pointer to list Data
    /// @param _amt (uint256) - Amount to substract
    function redeem(Data storage _data, uint256 _amt) internal {
        Iteration storage cur = _data.values[_data.cur];
        require(cur.startBlock != 0, "Current iteration not active");
        require(cur.softCapTimestamp == 0, "Iteration reached soft cap");

        cur.totalReceived = cur.totalReceived.sub(_amt);
    }

    /// @dev Return the order number of the current active iteration, if there is an active iteration.
    /// If there are no active iterations, first return value is false.
    /// @param _data (Data storage) - Pointer to list Data
    /// @return ok (bool) - True if num is the current iteration
    /// @return num (uint16) - Order number of the current iteration
    function currentIteration(Data storage _data)
        internal
        view
        returns (bool ok, uint16 num)
    {
        num = _data.cur;
        ok = _data.values[num].startBlock != 0;
        return (ok, num);
    }

    /// @dev Return if an iteration with the given number is active.
    /// @param _data (Data storage) - Ptr to list Data
    /// @param _num (uint16) - Order number of an iteration
    /// @return (bool ok) - True if itearation is active
    function isActive(Data storage _data, uint16 _num)
        internal
        view
        returns (bool ok)
    {
        return _data.values[_num].startBlock != 0;
    }

    /// @dev Get the soft cap timestamp of the current iteration.
    /// Value is 0 if the current iteration has not reached its soft cap
    /// @param _data (Data storage) - Pointer to list Data
    /// @return timestamp (uint256) - Timestamp, or 0
    function softCapTimestamp(Data storage _data)
        internal
        view
        returns (uint256 timestamp)
    {
        return _data.values[_data.cur].softCapTimestamp;
    }

    /// @dev Check if the current iteration has reached hard cap.
    /// @param _data (Data storage) - Pointer to list Data
    /// @return ok (bool) - True if hard cap reached
    function hasReachedHardCap(Data storage _data)
        internal
        view
        returns (bool ok)
    {
        Iteration storage cur = _data.values[_data.cur];
        return cur.totalReceived >= cur.hardCap;
    }

    /// @dev Get the total received amount of the current iteration.
    /// @param _data (Data storage) - Pointer to list Data
    /// @return amt (uint256) - Amount of DAI received
    function totalReceived(Data storage _data)
        internal
        view
        returns (uint256 amt)
    {
        return _data.values[_data.cur].totalReceived;
    }

    /// @dev Get the conversion ratio of the current iteration.
    /// @param _data (Data storage) - Pointer to list Data
    /// @return numerator (uint256) - Numerator factor
    /// @return denominator (uint256) - Denominator factor
    function conversionRatio(Data storage _data)
        internal
        view
        returns (uint256 numerator, uint256 denominator)
    {
        Iteration storage cur = _data.values[_data.cur];
        return (cur.numerator, cur.denominator);
    }

    /// @dev Returns all numerator, denominators, soft and hard cap values.
    /// @param _data (Data storage) - Pointer to list Data
    /// @return numerators (uint256[] memory) - Numerator factors
    /// @return denominators (uint256[] memory) - Denominator factors
    /// @return softCaps (uint256[] memory) - Soft cap values
    /// @return hardCaps (uint256[] memory) - Hard cap values
    function enumerate(Data storage _data)
        internal
        view
        returns (
            uint256[] memory numerators,
            uint256[] memory denominators,
            uint256[] memory softCaps,
            uint256[] memory hardCaps
        )
    {
        numerators = new uint256[](_data.cnt);
        denominators = new uint256[](_data.cnt);
        softCaps = new uint256[](_data.cnt);
        hardCaps = new uint256[](_data.cnt);

        for (uint16 i = 0; i < _data.cnt; ++i) {
            numerators[i] = _data.values[i].numerator;
            denominators[i] = _data.values[i].denominator;
            softCaps[i] = _data.values[i].softCap;
            hardCaps[i] = _data.values[i].hardCap;
        }

        return (numerators, denominators, softCaps, hardCaps);
    }
}
