pragma solidity ^0.5.0;

import "./deps/IMintable.sol";
import "./registry/Registry.sol";
import "./registry/AdminRole.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Minter is AdminRole {
    using SafeMath for uint256;

    event Donate(
        address indexed sender,
        address indexed token,
        uint64 indexed receiverId,
        uint256 amount,
        uint256 receivedCSTK,
        bytes32 homeTx
    );

    event Mint(
        address indexed recipient,
        uint256 amount
    );

    uint256 private constant MAX_TRUST_DENOMINATOR = 10000000;

    Registry internal registry;
    IERC20 internal cstkToken;
    IMintable internal dao;

    address public authorizedKey;

    uint256 public numerator;
    uint256 public denominator;

    constructor(
        address[] memory _authorizedKeys,
        address _daoAddress,
        address _registryAddress,
        address _cstkTokenAddress
    ) public AdminRole(_authorizedKeys) {
        // require(_authorizedKey != address(0), "Authorized key cannot be empty");

        dao = IMintable(_daoAddress);
        registry = Registry(_registryAddress);
        cstkToken = IERC20(_cstkTokenAddress);

        // authorizedKey = _authorizedKey;
    }

    function setRatio(uint256 _numerator, uint256 _denominator)
        external
        onlyAdmin
    {
        numerator = _numerator;
        denominator = _denominator;
    }

    function mint(address recipient, uint256 toMint) external onlyAdmin {
        _mint(recipient, toMint);
        emit Mint(recipient,toMint);
    }

    function _mint(address recipient, uint256 toMint) internal {
        // Determine the maximum supply of the CSTK token.
        uint256 totalSupply = cstkToken.totalSupply();

        // Get the max trust amount for the recipient acc from the Registry.
        uint256 maxTrust = registry.getMaxTrust(recipient);

        // Get the current CSTK balance of the recipient account.
        uint256 recipientBalance = cstkToken.balanceOf(recipient);

        // The recipient cannot receive more than the following amount of tokens:
        // maxR := maxTrust[recipient] * TOTAL_SUPPLY / 10000000.
        uint256 maxToReceive = maxTrust.mul(totalSupply).div(
            MAX_TRUST_DENOMINATOR
        );

        // If the recipient is to receive more than this amount of tokens, reduce
        // mint the difference.
        if (maxToReceive <= recipientBalance.add(toMint)) {
            toMint = maxToReceive.sub(recipientBalance);
        }

        // If there is anything to mint, mint it to the recipient.
        if (toMint > 0) {
            dao.mint(recipient, toMint);
        }
    }

    function deposit(
        address sender,
        address token,
        uint64 receiverId,
        uint256 amount,
        bytes32 homeTx
    ) external onlyAdmin {
        require(denominator != 0, "denominator cannot be 0");

        // Get the amount to mint based on the numerator/denominator.
        uint256 toMint = amount.mul(numerator).div(denominator);

        _mint(sender, toMint);

        emit Donate(sender, token, receiverId, amount, toMint, homeTx);
    }
}
