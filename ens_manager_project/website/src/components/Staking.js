import React, { useState } from "react";
import { getContract } from "../contracts/StakingContract";

const Staking = ({ web3, account }) => {
  const [amount, setAmount] = useState("");

  const stake = async () => {
    const stakingContract = getContract("staking", web3);
    await stakingContract.methods.stake().send({ from: account, value: web3.utils.toWei(amount, "ether") });
    alert("Staked successfully!");
  };

  return (
    <div>
      <h3>Stake ETH</h3>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in ETH" />
      <button onClick={stake}>Stake</button>
    </div>
  );
};

export default Staking;