pragma solidity ^0.5.0;

/*
  MiniMeToken contract taken from https://github.com/Giveth/minime/

 */
import "./TokenController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";
import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

// Minime interface
contract IMiniMeToken {
    /// @notice Generates `_amount` tokens that are assigned to `_owner`
    /// @param _owner The address that will be assigned the new tokens
    /// @param _amount The quantity of tokens generated
    /// @return True if the tokens are generated correctly
    function generateTokens(address _owner, uint _amount) public returns (bool);
    function changeController(address _newController) public;
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

contract TechController is TokenController,Ownable, WhitelistAdminRole, WhitelistedRole {
    IMiniMeToken public techToken;          // The new token
    IERC20 public contributionToken;        // The contribution token address (DAI)
    address public contributionDestination; // address where to send contributed tokens to
    uint256 public totalContribution;

    uint256 public currentMultiplier;
    uint256 public currentHardCap;

    mapping(address => uint256) public contributionCap;
    mapping(address => uint256) public contributionSum;

    constructor(address _techToken,address _contributionToken,address _contributionDestination) public {
        techToken = IMiniMeToken(_techToken);
        contributionToken = IERC20(_contributionToken);
        contributionDestination = _contributionDestination;
        currentMultiplier = 0;
        currentHardCap = 0;
    }

/////////////////
// TokenController interface
/////////////////

    // configure a new contribution phase
    function startContributionPhase(uint256 _newMultiplier, uint256 _newHardCap) public onlyOwner {
        require(_newMultiplier>0,"multiplier not valid");
        require(_newHardCap>totalContribution,"hardcap not valid");

        currentMultiplier = _newMultiplier;
        currentHardCap = _newHardCap;

    }

    // pass on controller
    function passController(address _newController) public onlyOwner {
        techToken.changeController(_newController);
    }

    function proxyPayment(address /*_owner*/) public payable returns(bool) {
        return false;
    }

/// @notice Notifies the controller about a transfer, for this controller all
///  transfers are allowed by default and no extra notifications are needed
/// @return False if the controller does not authorize the transfer
    function onTransfer(address /* _from */, address /* _to */ , uint /* _amount */) public returns(bool) {
        return false;
    }

/// @notice Notifies the controller about an approval, for this controller all
///  approvals are allowed by default and no extra notifications are needed
/// @return False if the controller does not authorize the approval
    function onApprove(address /* _owner */, address /* _spender */, uint /* _amount */)
       public returns(bool)
    {
        return true;
    }

    event Contributed(address indexed _sender,uint256 _contributionAmount,uint256 _receiveAmount);

    function contribute(uint256 _contributionAmount,address _recepient) public onlyWhitelisted {

        require(currentMultiplier>0,"multiplier not valid");
        require(currentHardCap > totalContribution,"hardcap not valid");

        require(totalContribution + _contributionAmount <= currentHardCap, "donation over hard-cap");
        require(contributionSum[msg.sender] + _contributionAmount <= contributionCap[msg.sender], "donation over personal cap");

        uint256 receiveAmount = _contributionAmount * currentMultiplier / 100;

        // receive contribution token (DAI)
        if (!contributionToken.transferFrom(msg.sender,contributionDestination,_contributionAmount)){
            revert("receiving contribution token failed");
        }

        // mint new Tech tokens
        if (!techToken.generateTokens(_recepient, receiveAmount)) {
            revert("minting tokens failed");
        }

        contributionSum[msg.sender] = contributionSum[msg.sender] + _contributionAmount;
        totalContribution += _contributionAmount;

        emit Contributed(msg.sender,_contributionAmount,receiveAmount);

    }

    function whitelist(address _account, uint256 _maxcontribution) public onlyWhitelistAdmin {
        addWhitelisted(_account);
        contributionCap[_account] = _maxcontribution;
    }

}