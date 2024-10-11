const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry", function () {
    let Registry;
    let registry;
    let owner, addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        Registry = await ethers.getContractFactory("Registry");
        registry = await Registry.deploy();

        await registry.deployed();
    });

    it("Should deploy the Registry contract", async function () {
        expect(registry.address).to.not.be.undefined;
    });

    it("Should register a resolver", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, addr1.address);

        expect(await registry.getResolver(hash)).to.equal(addr1.address);
    });

    it("Should revert if hash is already registered", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, addr1.address);

        await expect(registry.register(hash, addr1.address)).to.be.revertedWith("Resolver already registered");
    });

    it("Should return address(0) if hash is not registered", async function () {
        const hash = ethers.utils.id("example");

        expect(await registry.getResolver(hash)).to.equal(ethers.constants.AddressZero);
    });
});
