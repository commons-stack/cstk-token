pragma solidity ^0.5.0;

import "./RedeemableToken.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../registry/AdminRole.sol";
import "./TokenManager.sol";


contract RCSTKToken is RedeemableToken, AdminRole {
    constructor(
        address daiTokenAddress,
        address cstkTokenAddress,
        address payable cstkTokenManagerAddress,
        address payable vaultAddress,
        address[] memory _admins
    )
        public
        RedeemableToken("Redeemable CSTK Token", "rCSTK", false)
        AdminRole(_admins)
    {
        daiToken = IERC20(daiTokenAddress);
        cstkToken = IERC20(cstkTokenAddress);
        cstkTokenManager = TokenManager(cstkTokenManagerAddress);
        vault = Vault(vaultAddress);
        newIteration(5, 2, 984000, 1250000);
        newIteration(2, 1, 796000, 1000000);
        newIteration(3, 2, 1170000, 1500000);
        newIteration(5, 4, 820000, 1000000);
        newIteration(1, 1, 2950000, 3750000);
        for (uint256 index = 0; index < _admins.length; index++) {
            addPauser(_admins[index]);
        }
        pause();
    }

    struct Iteration {
        bool active;
        uint256 numerator; //multiplication factor
        uint256 denominator; // multiplication factor
        uint256 softCap; //in DAI
        uint256 hardCap; //in DAI
        uint256 startBlock; //when did this iteration start
        uint256 softCapTimestamp; //when the softcap was reached
        uint256 totalReceived; //total DAI received in this iteration
        mapping(address => uint256) spendable; //a mapping to keep track who has spent how much of his balance ( redeemed for DAI or converted to CSTK)
    }

    uint256 numIterations;
    mapping(uint256 => Iteration) iterations;
    IERC20 daiToken;
    IERC20 cstkToken;
    TokenManager cstkTokenManager;
    Vault vault;
    uint256 FIVE_DAYS_IN_SECONDS = 432000;

    modifier onlyContributor(address wallet) {
        require(
            registry.isContributor(wallet),
            "Only contributors can call this."
        );
        _;
    }

    function newIteration(
        uint256 _numerator,
        uint256 _denominator,
        uint256 _softCap,
        uint256 _hardCap
    ) internal returns (uint256 iterationID) {
        iterationID = numIterations++ - 1;
        iterations[iterationID] = Iteration(
            false,
            _numerator,
            _denominator,
            _softCap,
            _hardCap,
            0,
            0,
            0
        );
    }

    function startFirstIteration() public onlyAdmin {
        //TODO check if iteration 0 exist.
        require(
            iterations[0].startBlock == 0,
            "First iteration has already been started."
        );
        iterations[0].startBlock = block.number;
        iterations[0].active = true;
    }

    function switchIteration(uint8 _iterationFrom, uint8 _iterationTo)
        public
        onlyAdmin
    {
        require(
            _iterationFrom == _iterationTo - 1,
            "_iterationTo need to follow _iterationFrom"
        );
        require(
            iterations[_iterationFrom].active == true,
            "_iterationFrom is not the active iteration."
        );

        require(
            iterations[_iterationFrom].softCapTimestamp > 0,
            "softCap has not been reached yet on the active iteration."
        );

        iterations[_iterationFrom].active = false;
        iterations[_iterationTo].active = true;
        iterations[_iterationTo].startBlock = block.number;
        //TODO : siphon all DAI of _iterationFrom to CS Multisig
    }

    function buyTokens(uint8 _iteration, uint256 _amountDAI)
        public
        whenNotPaused
        onlyContributor(msg.sender)
    {
        require(
            _iteration < numIterations,
            "This iteration does not exist yet."
        );
        require(
            iterations[_iteration].active,
            "This iteration is not active at this time."
        );

        require(
            iterations[_iteration].totalReceived ==
                iterations[_iteration].hardCap,
            "This iteration has reached its hardCap already."
        );

        require(
            block.timestamp <
                iterations[_iteration].softCapTimestamp + FIVE_DAYS_IN_SECONDS,
            "Softcap timestamp has been reached more than 5 days ago."
        );

        if (
            iterations[_iteration].totalReceived + _amountDAI >=
            iterations[_iteration].hardCap
        ) {
            //switch iteration if passing hardcap
            for (
                uint256 amountDAIcurrentIteration = iterations[_iteration]
                    .hardCap - iterations[_iteration].totalReceived;
                iterations[_iteration].totalReceived + _amountDAI >=
                iterations[_iteration].hardCap;
                _amountDAI -= amountDAIcurrentIteration
            ) {
                _buyTokens(_iteration, amountDAIcurrentIteration);
                switchIteration(_iteration, _iteration + 1);
                _iteration++;
            }
        }
        _buyTokens(_iteration, _amountDAI);
    }

    function _buyTokens(uint8 _iteration, uint256 _amountDAI)
        internal
        whenNotPaused
    {
        uint256 amountTokens = SafeMath.mul(
            _amountDAI,
            SafeMath.div(
                iterations[_iteration].numerator,
                iterations[_iteration].denominator
            )
        );
        require(
            balanceOf(msg.sender) +
                cstkToken.balanceOf(msg.sender) +
                amountTokens <=
                registry.getAllowed(wallet),
            "Buying that amount of tokens would get the contributor above their allowance."
        );
        daiToken.transferFrom(msg.sender, address(this), _amountDAI);
        iterations[_iteration].totalReceived += _amountDAI;
        iterations[_iteration].spendable[msg.sender] += amountTokens;
        _mint(msg.sender, amountTokens);
        if (
            iterations[_iteration].totalReceived >
            iterations[_iteration].softCap
        ) {
            iterations[_iteration].softCapTimestamp = block.number;
        }
    }

    function ditchTokens(uint8 _iteration, uint256 _amountTokens)
        public
        whenNotPaused
        onlyContributor(msg.sender)
    {
        require(
            _iteration < numIterations,
            "This iteration does not exist yet."
        );
        require(
            iterations[_iteration].active,
            "This iteration is not active at this time."
        );
        require(
            iterations[_iteration].softCapTimestamp == 0,
            "This iteration has reached its softCap already."
        );
        require(
            iterations[_iteration].spendable[msg.sender] >= _amountTokens,
            "This iteration has reached its softCap already."
        );

        uint256 _amountDAI = SafeMath.mul(
            _amountTokens,
            SafeMath.div(
                iterations[_iteration].denominator,
                iterations[_iteration].numerator
            )
        );
        _ditchTokens(_amountTokens, _amountDAI);
        iterations[_iteration].totalReceived -= _amountDAI;
        iterations[_iteration].spendable[msg.sender] -= _amountTokens;
    }

    function _ditchTokens(uint256 _amountTokens, uint256 _daiAmount)
        internal
        whenNotPaused
    {
        daiToken.transfer(msg.sender, _daiAmount);
        _burn(msg.sender, _amountTokens);
    }

    function redeemTokens(uint8 _iteration, uint256 _amountTokens)
        public
        whenNotPaused
        onlyContributor(msg.sender)
    {
        require(
            _iteration < numIterations,
            "This iteration does not exist yet."
        );
        require(
            iterations[_iteration].active,
            "This iteration is not active at this time."
        );
        require(
            iterations[_iteration].spendable[msg.sender] >= _amountTokens,
            "This iteration has reached its softCap already."
        );
        _redeemTokens(_amountTokens);
        iterations[_iteration].spendable[msg.sender] -= _amountTokens;
    }

    function _redeemTokens(uint256 _amountTokens) internal whenNotPaused {
        //mint CSTK tokens
        cstkTokenManager.mint(msg.sender, _amountTokens);
        _burn(msg.sender, _amountTokens);
    }
}
