// '..scripts/deploy.js

const { ethers, upgrades } = require("hardhat");

async function main() {
    // Replace with your actual contract addresses and initial values
    const registryAddress = 'YOUR_REGISTRY_CONTRACT_ADDRESS';
    const feeRecipientAddress = 'YOUR_FEE_RECIPIENT_CONTRACT_ADDRESS';
    const initialFee = ethers.utils.parseEther('0.1'); // Set the initial registration fee

    // Deploy the AttestationManager contract
    const AttestationManager = await ethers.getContractFactory("AttestationManager");
    const attestationManager = await upgrades.deployProxy(
        AttestationManager,
        [registryAddress, feeRecipientAddress, initialFee],
        { initializer: "initialize" }
    );

    await attestationManager.deployed();

    console.log("AttestationManager deployed to:", attestationManager.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
