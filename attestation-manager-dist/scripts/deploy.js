const { ethers } = require("hardhat");

async function main() {
    const Registry = await ethers.getContractFactory("Registry");
    const Resolver = await ethers.getContractFactory("Resolver");

    const registry = await Registry.deploy();
    await registry.deployed();
    console.log("Registry deployed to:", registry.address);

    const resolver = await Resolver.deploy();
    await resolver.deployed();
    console.log("Resolver deployed to:", resolver.address);

    const hash = ethers.utils.id("example");
    await registry.register(hash, resolver.address);
    console.log("Resolver registered for hash:", hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

