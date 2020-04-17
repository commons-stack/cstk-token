pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";


contract RedeemableToken is ERC20Detailed, ERC20Mintable, ERC20Pausable {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        bool _transfersEnabled
    ) public ERC20Detailed(tokenName, tokenSymbol, 18) {
        transfersEnabled = _transfersEnabled;
        _addPauser(msg.sender); 
    }

    bool transfersEnabled;

    function buyTokens(uint8 _iteration, uint256 _amountDAI) public;
    function _redeemTokens(uint256 _amountTokens, uint256 _daiAmount) internal;
    function _ditchTokens(uint256 _amountTokens, uint256 _daiAmount) internal;    
}
