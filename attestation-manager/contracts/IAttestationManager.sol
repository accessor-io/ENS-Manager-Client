// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAttestationManager {
    function updateRegistrationFee(uint256 newFee) external;
}

contract Proposal {
    IAttestationManager public attestationManager;

    constructor(address _attestationManager) {
        attestationManager = IAttestationManager(_attestationManager);
    }

    function execute(uint256 newFee) external {
        attestationManager.updateRegistrationFee(newFee);
    }
}
