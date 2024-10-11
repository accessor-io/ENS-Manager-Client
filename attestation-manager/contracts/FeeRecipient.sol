// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract FeeRecipient is Initializable, OwnableUpgradeable {
    event FundsWithdrawn(address indexed owner, uint256 amount);

    function initialize(address owner) public initializer {
        __Ownable_init();
        transferOwnership(owner);
    }

    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
        emit FundsWithdrawn(owner(), balance);
    }

    receive() external payable {}
}
