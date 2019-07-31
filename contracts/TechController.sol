pragma solidity ^0.5;

/*
  MiniMeToken contract taken from https://github.com/Giveth/minime/

 */
import "./TokenController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";
import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";

// Minime interface
contract IMiniMeToken {
    /// @notice Generates `_amount` tokens that are assigned to `_owner`
    /// @param _owner The address that will be assigned the new tokens
    /// @param _amount The quantity of tokens generated
    /// @return True if the tokens are generated correctly
    function generateTokens(address _owner, uint _amount) public returns (bool);
}

// // Taken from Zeppelin's standard contracts.
// contract ERC20 {
//   uint public totalSupply;
//   function balanceOf(address who) constant returns (uint);
//   function allowance(address owner, address spender) constant returns (uint);

//   function transfer(address to, uint value) returns (bool ok);
//   function transferFrom(address from, address to, uint value) returns (bool ok);
//   function approve(address spender, uint value) returns (bool ok);
//   event Transfer(address indexed from, address indexed to, uint value);
//   event Approval(address indexed owner, address indexed spender, uint value);
// }

contract TechController is TokenController, WhitelistAdminRole, WhitelistedRole {
    IMiniMeToken public techToken;   // The new token
    IERC20 public contributionToken;              // The contribution token address (DAI)
    address public contributionDestination;
    uint256 public totalContribution;

    mapping(address => uint) public techTokencaps;

    constructor(address _contributionToken,address _contributionDestination) public {
        contributionToken = IERC20(_contributionToken);
        contributionDestination = _contributionDestination;
    }

/////////////////
// TokenController interface
/////////////////


 function proxyPayment(address /*_owner*/) public payable returns(bool) {
        return false;
    }

/// @notice Notifies the controller about a transfer, for this SWTConverter all
///  transfers are allowed by default and no extra notifications are needed

/// @return False if the controller does not authorize the transfer
    function onTransfer(address /* _from */, address /* _to */ , uint /* _amount */) public returns(bool) {
        return false;
    }

/// @notice Notifies the controller about an approval, for this SWTConverter all
///  approvals are allowed by default and no extra notifications are needed

/// @return False if the controller does not authorize the approval
    function onApprove(address /* _owner */, address /* _spender */, uint /* _amount */)
       public returns(bool)
    {
        return true;
    }

    /// @notice returns multiplier * 100 of current stage 
    function getMultiplier() public returns (uint256) {
        if (totalContribution < 984000 * 10e18){
            return 250;
        }
        if (totalContribution < 1710000 * 10e18){
            return 200;
        }
        if (totalContribution < 2850000 * 10e18){
            return 150;
        }
        return 100;
    }

    /// @notice returns amount of allowed donation still in this stage 
    function getAllowedContribution(uint256 _contributionAmount) public {
        // if (totalContribution)
    }


    function contribute(uint256 _contributionAmount,address _recepient) public onlyWhitelisted {

        uint256 _amount = getMultiplier() * _contributionAmount / 100;

        // mint new Tech tokens
        if (!techToken.generateTokens(_recepient, _amount)) {
            revert("minting tokens failed");
        }

    }

    function whitelist(address _account, uint256 _maxcontribution) public onlyWhitelistAdmin {
        addWhitelisted(_account);
        techTokencaps[_account] = _maxcontribution;
        
    }

// /// @notice converts ARC tokens to new SWT tokens and forwards ARC to the vault address.
// /// @param _amount The amount of ARC to convert to SWT
//  function addWhitelist(uint _amount){

//         // transfer ARC to the vault address. caller needs to have an allowance from
//         // this controller contract for _amount before calling this or the transferFrom will fail.
//         if (!arcToken.transferFrom(msg.sender, 0x0, _amount)) {
//             throw;
//         }

//         // mint new SWT tokens
//         if (!techToken.generateTokens(msg.sender, _amount)) {
//             throw;
//         }
//     }


}