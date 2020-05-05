pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";


contract DAIMock is ERC20Mintable {
    constructor(address[] memory _initialReceivers, uint256 _initialBalance)
        public
    {
        _mintToAll(_initialReceivers, _initialBalance);
    }

    function mintToAll(address[] memory _receivers, uint256 _amount) public {
        _mintToAll(_receivers, _amount);
    }

    function _mintToAll(address[] memory _receivers, uint256 _amount) internal {
        for (uint256 i = 0; i < _receivers.length; i++) {
            mint(_receivers[i], _amount);
        }
    }
}
