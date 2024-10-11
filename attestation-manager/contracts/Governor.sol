// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyGovernor is Initializable, GovernorUpgradeable, GovernorCountingSimpleUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable {
    function initialize(IVotesUpgradeable _token) public initializer {
        __Governor_init("MyGovernor");
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(4); // Set quorum fraction to 4%
    }

    // The following functions are overrides required by Solidity.

    function quorum(uint256 blockNumber) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block delay
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45818; // ~1 week in blocks (assuming 15s blocks)
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }
}
