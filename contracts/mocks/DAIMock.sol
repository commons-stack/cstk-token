pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract DAIMock is ERC20Detailed, ERC20Mintable {
    string internal constant NAME = "DAI Mock";
    string internal constant SYMBOL = "DAI";
    uint8 internal constant DECIMALS = 18;

    constructor(address[] memory _initialReceivers, uint256 _initialBalance)
        public
        ERC20Detailed(NAME, SYMBOL, DECIMALS)
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
