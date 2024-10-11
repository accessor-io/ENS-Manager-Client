const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Resolver", function () {
    let Resolver;
    let resolver;
    let owner, addr1, addr2;
    let PIVOT_ROLE;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        Resolver = await ethers.getContractFactory("Resolver");
        resolver = await Resolver.deploy();
        await resolver.deployed();

        PIVOT_ROLE = await resolver.PIVOT_ROLE();
    });

    it("Should deploy the Resolver contract", async function () {
        expect(resolver.address).to.not.be.undefined;
    });

    it("Should add address details to a group", async function () {
        const hash = ethers.utils.id("example");

        // Grant PIVOT_ROLE to owner
        await resolver.grantRole(PIVOT_ROLE, owner.address);

        await resolver.addAddress(hash, addr1.address, "Detail for addr1");

        const detail = await resolver.getAddressDetails(hash, addr1.address);
        expect(detail).to.equal("Detail for addr1");
    });

    it("Should not add address details without PIVOT_ROLE", async function () {
        const hash = ethers.utils.id("example");

        await expect(
            resolver.connect(addr1).addAddress(hash, addr1.address, "Detail for addr1")
        ).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${PIVOT_ROLE}`);
    });

    it("Should return empty string for unregistered address", async function () {
        const hash = ethers.utils.id("example");

        const detail = await resolver.getAddressDetails(hash, addr1.address);
        expect(detail).to.equal("");
    });

    it("Should retrieve multiple addresses and details for a group", async function () {
        const hash = ethers.utils.id("example");

        // Grant PIVOT_ROLE to owner
        await resolver.grantRole(PIVOT_ROLE, owner.address);

        await resolver.addAddress(hash, addr1.address, "Detail for addr1");
        await resolver.addAddress(hash, addr2.address, "Detail for addr2");

        const detail1 = await resolver.getAddressDetails(hash, addr1.address);
        const detail2 = await resolver.getAddressDetails(hash, addr2.address);

        expect(detail1).to.equal("Detail for addr1");
        expect(detail2).to.equal("Detail for addr2");
    });

    it("Should have correct admin role setup", async function () {
        const DEFAULT_ADMIN_ROLE = await resolver.DEFAULT_ADMIN_ROLE();
        expect(await resolver.getRoleAdmin(PIVOT_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
});
