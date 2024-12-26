import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ENS } from '@ensdomains/ensjs';

const BridgeActionsComponent = ({ web3, accounts, contract }) => {
  const [data, setData] = useState('');
  const [destinationChain, setDestinationChain] = useState('');
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [customData, setCustomData] = useState('');
  const [resolvedToken, setResolvedToken] = useState('');

  const sendData = async () => {
    await contract.methods.sendData(data, destinationChain).send({ from: accounts[0] });
  };

  const initiateTransfer = async () => {
    const value = web3.utils.toWei('0.01', 'ether'); // Example fee
    await contract.methods.initiateTransfer(destinationChain, resolvedToken, amount, customData).send({ from: accounts[0], value });
  };

  const resolveToken = async () => {
    if (token.endsWith('.eth')) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const ens = new ENS({ provider });
      try {
        const address = await ens.getAddress(token);
        setResolvedToken(address);
      } catch (error) {
        console.error("Failed to resolve ENS name:", error);
        setResolvedToken(token);
      }
    } else {
      setResolvedToken(token);
    }
  };

  return (
    <div>
      <h2>Bridge Actions</h2>
      <div>
        <h3>Send Data</h3>
        <input 
          type="text" 
          placeholder="Data" 
          value={data} 
          onChange={(e) => setData(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Destination Chain" 
          value={destinationChain} 
          onChange={(e) => setDestinationChain(e.target.value)} 
        />
        <button onClick={sendData}>Send Data</button>
      </div>
      <div>
        <h3>Initiate Transfer</h3>
        <input 
          type="text" 
          placeholder="Destination Chain" 
          value={destinationChain} 
          onChange={(e) => setDestinationChain(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Token Address or ENS Name" 
          value={token} 
          onChange={(e) => setToken(e.target.value)} 
        />
        <button onClick={resolveToken}>Resolve Token</button>
        {resolvedToken && <p>Resolved Token Address: {resolvedToken}</p>}
        <input 
          type="text" 
          placeholder="Amount" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Custom Data" 
          value={customData} 
          onChange={(e) => setCustomData(e.target.value)} 
        />
        <button onClick={initiateTransfer}>Initiate Transfer</button>
      </div>
    </div>
  );
};

export default BridgeActionsComponent;
