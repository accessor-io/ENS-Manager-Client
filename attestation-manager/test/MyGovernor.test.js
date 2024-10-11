const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Governor", function () {
    let MyGovernor, Token, AttestationManager;
    let myGovernor, token, attestationManager;
    let owner, addr1, addr2, feeRecipient;
    const registrationFee = ethers.utils.parseEther("0.1");

    beforeEach(async function () {
        [owner, addr1, addr2, feeRecipient] = await ethers.getSigners();

        // Deploy ERC20 Token
        Token = await ethers.getContractFactory("MyToken");
        token = await Token.deploy("MyToken", "MTK", ethers.utils.parseEther("1000"));
        await token.deployed();

        // Deploy AttestationManager
        const Registry = await ethers.getContractFactory("Registry");
        const Resolver = await ethers.getContractFactory("Resolver");
        const registry = await Registry.deploy();
        const resolver = await Resolver.deploy();
        await registry.deployed();
        await resolver.deployed();

        AttestationManager = await ethers.getContractFactory("AttestationManager");
        attestationManager = await upgrades.deployProxy(
            AttestationManager,
            [registry.address, feeRecipient.address, registrationFee],
            { initializer: "initialize" }
        );
        await attestationManager.deployed();

        // Deploy MyGovernor
        MyGovernor = await ethers.getContractFactory("MyGovernor");
        myGovernor = await upgrades.deployProxy(
            MyGovernor,
            [token.address],
            { initializer: "initialize" }
        );
        await myGovernor.deployed();

        // Mint tokens to addr1 and addr2
        await token.mint(addr1.address, ethers.utils.parseEther("100"));
        await token.mint(addr2.address, ethers.utils.parseEther("100"));
    });

    it("Should create a proposal to update the registration fee", async function () {
        const newFee = ethers.utils.parseEther("0.2");
        const encodedFunctionCall = attestationManager.interface.encodeFunctionData("updateRegistrationFee", [newFee]);

        const proposalTx = await myGovernor.connect(owner).propose(
            [attestationManager.address],
            [0],
            [encodedFunctionCall],
            "Proposal to update the registration fee"
        );

        const proposalReceipt = await proposalTx.wait();
        const proposalId = proposalReceipt.events[0].args.proposalId;

        expect(await myGovernor.state(proposalId)).to.equal(0); // Pending

        // Fast forward to voting start
        await ethers.provider.send("evm_mine", []);
        expect(await myGovernor.state(proposalId)).to.equal(1); // Active

        // Vote on the proposal
        await myGovernor.connect(addr1).castVote(proposalId, 1); // Vote For
        await myGovernor.connect(addr2).castVote(proposalId, 1); // Vote For

        // Fast forward to voting end
        for (let i = 0; i < 45818; i++) {
            await ethers.provider.send("evm_mine", []);
        }

        expect(await myGovernor.state(proposalId)).to.equal(4); // Succeeded

        // Queue and Execute the proposal
        const descriptionHash = ethers.utils.id("Proposal to update the registration fee");
        await myGovernor.queue(
            [attestationManager.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
        );

        // Fast forward the time lock
        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // 2 days
        await ethers.provider.send("evm_mine", []);

        await myGovernor.execute(
            [attestationManager.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
        );

        expect(await attestationManager.registrationFee()).to.equal(newFee);
    });
});
