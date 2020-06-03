pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract CSTKTokenManagerMock is ERC20Detailed, ERC20Mintable {
    string internal constant NAME = "CSTK Token";
    string internal constant SYMBOL = "CSTK";
    uint8 internal constant DECIMALS = 18;

    constructor() public ERC20Detailed(NAME, SYMBOL, DECIMALS) {}
}
