pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

import "../token/redeemable/token/RCSTK.sol";

contract RCSTKMock is ERC20Mintable, RCSTK {
    constructor(
        uint256 _cnt,
        uint256[] memory _numerators,
        uint256[] memory _denominators,
        uint256[] memory _softCaps,
        uint256[] memory _hardCaps,
        address _tokenBankAddress,
        address _cstkTokenAddress,
        address _cstkTokenManagerAddress,
        address _registryAddress,
        address[] memory _admins,
        address _escapeHatchCaller,
        address payable _escapeHatchDestination
    )
        public
        RCSTK(
            _cnt,
            _numerators,
            _denominators,
            _softCaps,
            _hardCaps,
            _tokenBankAddress,
            _cstkTokenAddress,
            _cstkTokenManagerAddress,
            _registryAddress,
            _admins,
            _escapeHatchCaller,
            _escapeHatchDestination
        )
    {}
}
