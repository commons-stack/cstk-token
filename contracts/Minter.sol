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
        uint256 amountCSTK = amount.mul(numerator).div(denominator);
        uint256 totalSupply = cstkToken.totalSupply();

        uint256 maxTrust = registry.getMaxTrust(sender);
        uint256 senderBalance = cstkToken.balanceOf(sender);
        require(
            maxTrust.mul(totalSupply).div(10000000) >=
                senderBalance + amountCSTK,
            "not allowed"
        );

        dao.mint(sender, amountCSTK);

        emit Donate(sender, token, receiverId, amount, amountCSTK, homeTx);
    }
}
