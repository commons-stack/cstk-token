pragma solidity ^0.5.0;

import "./deps/IMintable.sol";
import "./registry/Registry.sol";
import "./registry/AdminRole.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Minter {
    using SafeMath for uint256;

    event Donate(
        address indexed sender,
        address indexed token,
        uint64 indexed receiverId,
        uint256 amount,
        uint256 receivedCSTK,
        bytes32 homeTx
    );

    uint256 private constant MAX_TRUST_DENOMINATOR = 10000000;

    Registry internal registry;
    IERC20 internal cstkToken;
    IMintable internal dao;

    address public authorizedKey;

    uint256 public numerator;
    uint256 public denominator;

    constructor(
        address _authorizedKey,
        address _daoAddress,
        address _registryAddress,
        address _cstkTokenAddress
    ) public {
        require(_authorizedKey != address(0), "Authorized key cannot be empty");

        dao = IMintable(_daoAddress);
        registry = Registry(_registryAddress);
        cstkToken = IERC20(_cstkTokenAddress);

        authorizedKey = _authorizedKey;
    }

    modifier onlyAuthorizedKey {
        require(msg.sender == authorizedKey, "Permission denied");
        _;
    }

    function setRatio(uint256 _numerator, uint256 _denominator)
        external
        onlyAuthorizedKey
    {
        numerator = _numerator;
        denominator = _denominator;
    }

    function deposit(
        address sender,
        address token,
        uint64 receiverId,
        uint256 amount,
        bytes32 homeTx
    ) external onlyAuthorizedKey {
        require(denominator != 0, "denominator cannot be 0");

        // Determine the maximum supply of the CSTK token.
        uint256 totalSupply = cstkToken.totalSupply();

        // Get the max trust amount for the sender acc from the Registry.
        uint256 maxTrust = registry.getMaxTrust(sender);

        // Get the current CSTK balance of the sender account.
        uint256 senderBalance = cstkToken.balanceOf(sender);

        // Get the amount to mint based on the numerator/denominator.
        uint256 toMint = amount.mul(numerator).div(denominator);

        // The sender cannot receive more than the following amount of tokens:
        // maxR := maxTrust[sender] * TOTAL_SUPPLY / 10000000.
        uint256 maxToReceive = maxTrust.mul(totalSupply).div(
            MAX_TRUST_DENOMINATOR
        );

        // If the sender is to receive more than this amount of tokens, reduce
        // mint the difference.
        if (maxToReceive <= senderBalance.add(toMint)) {
            toMint = maxToReceive.sub(senderBalance);
        }

        // If there is anything to mint, mint it to the sender.
        if (toMint > 0) {
            dao.mint(sender, toMint);
        }

        emit Donate(sender, token, receiverId, amount, toMint, homeTx);
    }
}
