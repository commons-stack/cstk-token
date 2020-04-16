pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";

contract RedeemableToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Pausable {
    constructor(string memory _tokenName, string memory _tokenSymbol, bool _transfersEnabled) 
        ERC20Detailed(_tokenName, _tokenSymbol, 18) public {
        transfersEnabled = _transfersEnabled;
    }

    bool transfersEnabled;
}