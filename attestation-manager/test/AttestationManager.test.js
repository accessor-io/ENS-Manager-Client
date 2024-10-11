const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Attestation Manager", function () {
    let Registry, Resolver, AttestationManager;
    let registry, resolver, attestationManager;
    let owner, addr1, feeRecipient;
    const registrationFee = ethers.utils.parseEther("0.1");

    beforeEach(async function () {
        [owner, addr1, feeRecipient] = await ethers.getSigners();

        Registry = await ethers.getContractFactory("Registry");
        Resolver = await ethers.getContractFactory("Resolver");
        AttestationManager = await ethers.getContractFactory("AttestationManager");

        registry = await Registry.deploy();
        resolver = await Resolver.deploy();
        await registry.deployed();
        await resolver.deployed();

        attestationManager = await upgrades.deployProxy(
            AttestationManager,
            [registry.address, feeRecipient.address, registrationFee],
            { initializer: "initialize" }
        );
        await attestationManager.deployed();
    });

    it("Should register resolver", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, resolver.address);
        expect(await registry.getResolver(hash)).to.equal(resolver.address);
    });

    it("Should add address to resolver", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, resolver.address);
        await resolver.addAddress(hash, addr1.address, "Detail for addr1");
        expect(await resolver.getAddressDetails(hash, addr1.address)).to.equal("Detail for addr1");
    });

    it("Should create attestation and transfer fee", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, resolver.address);

        await expect(
            attestationManager.connect(addr1).createAttestation(hash, 3600, { value: registrationFee })
        ).to.changeEtherBalances(
            [addr1, feeRecipient],
            [-registrationFee, registrationFee]
        );

        const attestation = await attestationManager.getFullAttestation(hash);
        expect(attestation.issuer).to.equal(addr1.address);
    });

    it("Should add address to attestation", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, resolver.address);

        await attestationManager.connect(addr1).createAttestation(hash, 3600, { value: registrationFee });
        await attestationManager.connect(addr1).addAddress(hash, addr1.address, "Detail for addr1");

        const addresses = await attestationManager.getAddressesAndDetails(hash);
        expect(addresses[0].addr).to.equal(addr1.address);
        expect(addresses[0].detail).to.equal("Detail for addr1");
    });

    it("Should verify attestation", async function () {
        const hash = ethers.utils.id("example");
        await registry.register(hash, resolver.address);

R