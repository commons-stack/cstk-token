pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";


contract DAI is ERC20Mintable {
    constructor(address _initialReceiver, uint256 _balance) public {
        mint(_initialReceiver, _balance);
    }
}
