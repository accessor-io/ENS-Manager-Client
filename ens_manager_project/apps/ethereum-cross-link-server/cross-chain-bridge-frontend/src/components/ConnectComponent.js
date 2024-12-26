import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ENS } from '@ensdomains/ensjs';

const ConnectComponent = ({ onConnect }) => {
  const [account, setAccount] = useState(null);
  const [ensName, setEnsName] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setAccount(account);
        
        // Initialize ENS
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const ens = new ENS({ provider });

        // Resolve ENS name
        const name = await ens.getName(account);
        if (name.name) {
          setEnsName(name.name);
        }

        onConnect(account);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      console.log("Please install MetaMask!");
    }
  };

  return (
    <div>
      {account ? (
        <p>Connected: {ensName || account}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
};

export default ConnectComponent;
