// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IRegistry.sol";
import "./IResolver.sol";

contract AttestationManager is Initializable, AccessControlUpgradeable {
    using SafeMath for uint256;

    bytes32 public constant ATTESTER_ROLE = keccak256("ATTESTER_ROLE");
    IRegistry private registry;
    address private feeRecipient;

    uint256 public registrationFee;

    struct AddressDetail {
        address addr;
        string detail;
    }

    struct Attestation {
        address issuer;
        bytes32 groupHash;
        uint256 timestamp;
        uint256 expiration;
        bool revoked;
        AddressDetail[] addressDetails;
    }

    mapping(bytes32 => Attestation) private attestations;
    mapping(bytes32 => mapping(address => uint256)) private addressIndex; // To manage the index of addresses for easy removal

    event AttestationCreated(bytes32 indexed groupHash, address indexed issuer, uint256 timestamp, uint256 expiration);
    event AttestationVerified(bytes32 indexed groupHash, address indexed verifier);
    event AttestationRevoked(bytes32 indexed groupHash, address indexed issuer);
    event AddressAdded(bytes32 indexed groupHash, address indexed addr, string detail);
    event AddressRemoved(bytes32 indexed groupHash, address indexed addr);
    event RegistrationFeeChanged(uint256 newFee);
    event FeeRecipientChanged(address newRecipient);

    function initialize(address registryAddress, address feeRecipientAddress, uint256 initialFee) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ATTESTER_ROLE, msg.sender);
        registry = IRegistry(registryAddress);
        feeRecipient = feeRecipientAddress;
        registrationFee = initialFee;
    }

    function createAttestation(bytes32 groupHash, uint256 expiration) external payable onlyRole(ATTESTER_ROLE) {
        require(attestations[groupHash].issuer == address(0), "Attestation already exists");
        require(msg.value >= registrationFee, "Insufficient fee");

        // Transfer the fee to the recipient contract
        payable(feeRecipient).transfer(msg.value);

        attestations[groupHash] = Attestation({
            issuer: msg.sender,
            groupHash: groupHash,
            timestamp: block.timestamp,
            expiration: expiration,
            revoked: false,
            addressDetails: new AddressDetail 
        });

        registry.register(groupHash, address(this));
        emit AttestationCreated(groupHash, msg.sender, block.timestamp, expiration);
    }

    function addAddress(bytes32 groupHash, address addr, string memory detail) external onlyRole(ATTESTER_ROLE) {
        Attestation storage attestation = attestations[groupHash];
        require(attestation.issuer != address(0), "Attestation not found");
        require(!attestation.revoked, "Attestation revoked");

        attestation.addressDetails.push(AddressDetail({addr: addr, detail: detail}));
        addressIndex[groupHash][addr] = attestation.addressDetails.length - 1;

        emit AddressAdded(groupHash, addr, detail);
    }

    function removeAddress(bytes32 groupHash, address addr) external onlyRole(ATTESTER_ROLE) {
        Attestation storage attestation = attestations[groupHash];
        require(attestation.issuer != address(0), "Attestation not found");
        require(!attestation.revoked, "Attestation revoked");

        uint256 index = addressIndex[groupHash][addr];
        uint256 lastIndex = attestation.addressDetails.length - 1;

        if (index != lastIndex) {
            AddressDetail memory lastDetail = attestation.addressDetails[lastIndex];
            attestation.addressDetails[index] = lastDetail;
            addressIndex[groupHash][lastDetail.addr] = index;
        }

        attestation.addressDetails.pop();
        delete addressIndex[groupHash][addr];

        emit AddressRemoved(groupHash, addr);
    }

    function verifyAttestation(bytes32 groupHash, address addr) external view returns (bool) {
        Attestation storage attestation = attestations[groupHash];
        require(attestation.issuer != address(0), "Attestation not found");
        require(!attestation.revoked, "Attestation revoked");
        require(attestation.expiration > block.timestamp, "Attestation expired");

        address resolverAddress = registry.getResolver(groupHash);
        require(resolverAddress != address(0), "Resolver not found");

        IResolver resolver = IResolver(resolverAddress);
        string memory storedDetail = resolver.getAddressDetails(groupHash, addr);
        emit AttestationVerified(groupHash, msg.sender);

        for (uint256 i = 0; i < attestation.addressDetails.length; i++) {
            if (attestation.addressDetails[i].addr == addr) {
                return keccak256(abi.encodePacked(storedDetail)) == keccak256(abi.encodePacked(attestation.addressDetails[i].detail));
            }
        }

        return false;
    }

    function revokeAttestation(bytes32 groupHash) external onlyRole(ATTESTER_ROLE) {
        Attestation storage attestation = attestations[groupHash];
        require(attestation.issuer == msg.sender, "Only issuer can revoke");

        attestation.revoked = true;
        emit AttestationRevoked(groupHash, msg.sender);
    }

    function getAttestationDetails(bytes32 groupHash) external view returns (string memory) {
        require(attestations[groupHash].issuer != address(0), "Attestation not found");
        return attestations[groupHash].details;
    }

    function getFullAttestation(bytes32 groupHash) external view returns (Attestation memory) {
        require(attestations[groupHash].issuer != address(0), "Attestation not found");
        return attestations[groupHash];
    }

    function getAddressesAndDetails(bytes32 groupHash) external view returns (AddressDetail[] memory) {
        require(attestations[groupHash].issuer != address(0), "Attestation not found");
        return attestations[groupHash].addressDetails;
    }

    function updateRegistrationFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registrationFee = newFee;
        emit RegistrationFeeChanged(newFee);
    }

    function updateFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        feeRecipient = newRecipient;
        emit FeeRecipientChanged(newRecipient);
    }
}
