const { ethers, upgrades } = require("hardhat");

async function main() {
  const MyENSContract = await ethers.getContractFactory("MyENSContractV2");
  console.log("Deploying MyENSContractV2...");
  const myENS = await upgrades.deployProxy(MyENSContract, [], { initializer: 'initialize' });
  await myENS.deployed();
  console.log("MyENSContractV2 deployed to:", myENS.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });