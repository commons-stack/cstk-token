pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ERC20NonTransferrable is ERC20 {
    
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(false, "This token is non transferrable");
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        require(false, "This token is non transferrable");
    }

    function transferFrom(address sender, address recipient, uint256 amount)
        public
        returns (bool)
    {
        require(false, "This token is non transferrable");
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        returns (bool)
    {
        require(false, "This token is non transferrable");
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        returns (bool)
    {
        require(false, "This token is non transferrable");
    }
}
