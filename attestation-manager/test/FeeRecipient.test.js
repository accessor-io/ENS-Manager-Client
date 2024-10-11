const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FeeRecipient", function () {
    let FeeRecipient;
    let feeRecipient;
    let owner, addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        FeeRecipient = await ethers.getContractFactory("FeeRecipient");
        feeRecipient = await upgrades.deployProxy(FeeRecipient, [owner.address], { initializer: "initialize" });

        await feeRecipient.deployed();
    });

    it("Should initialize with the correct owner", async function () {
        expect(await feeRecipient.owner()).to.equal(owner.address);
    });

    it("Should receive funds", async function () {
        const depositAmount = ethers.utils.parseEther("1.0");

        await addr1.sendTransaction({
            to: feeRecipient.address,
            value: depositAmount
        });

        const balance = await ethers.provider.getBalance(feeRecipient.address);
        expect(balance).to.equal(depositAmount);
    });

    it("Should allow owner to withdraw funds", async function () {
        const depositAmount = ethers.utils.parseEther("1.0");

        await addr1.sendTransaction({
            to: feeRecipient.address,
            value: depositAmount
        });

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        const tx = await feeRecipient.withdrawFunds();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed.mul(tx.gasPrice);

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        const balance = await ethers.provider.getBalance(feeRecipient.address);

        expect(balance).to.equal(0);
        expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(depositAmount).sub(gasUsed));
    });

    it("Should not allow non-owner to withdraw funds", async function () {
        const depositAmount = ethers.utils.parseEther("1.0");

        await addr1.sendTransaction({
            to: feeRecipient.address,
            value: depositAmount
        });

        await expect(feeRecipient.connect(addr1).withdrawFunds()).to.be.revertedWith("Ownable: caller is not the owner");
    });
});
