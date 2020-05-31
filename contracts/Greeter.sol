pragma solidity ^0.5.17;


contract Greeter {
    string internal message;

    constructor(string memory _message) public {
        message = _message;
    }

    function setGreeting(string memory _message) public {
        message = _message;
    }

    function greeting() public view returns (string memory) {
        return message;
    }
}
