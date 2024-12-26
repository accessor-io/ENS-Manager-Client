import React, { useState } from 'react';
import { crossChainSetENSRecord } from '../utils/crossChain';

const CrossChainENSRecordSetter = () => {
  const [ensName, setEnsName] = useState('');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [sourceChainId, setSourceChainId] = useState(1);
  const [targetChainId, setTargetChainId] = useState(1);
  const [status, setStatus] = useState('');

  const handleSetRecord = async () => {
    try {
      const result = await crossChainSetENSRecord(ensName, key, value, sourceChainId, targetChainId);
      setStatus(`Record set successfully. Updated value: ${result}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div>
      <h2>Cross-Chain ENS Record Setter</h2>
      <input value={ensName} onChange={(e) => setEnsName(e.target.value)} placeholder="ENS Name" />
      <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Record Key" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Record Value" />
      <select value={sourceChainId} onChange={(e) => setSourceChainId(Number(e.target.value))}>
        <option value={1}>Mainnet</option>
        <option value={3}>Ropsten</option>
        <option value={4}>Rinkeby</option>
        <option value={5}>Goerli</option>
        <option value={42}>Kovan</option>
      </select>
      <select value={targetChainId} onChange={(e) => setTargetChainId(Number(e.target.value))}>
        <option value={1}>Mainnet</option>
        <option value={3}>Ropsten</option>
        <option value={4}>Rinkeby</option>
        <option value={5}>Goerli</option>
        <option value={42}>Kovan</option>
      </select>
      <button onClick={handleSetRecord}>Set Record</button>
      <p>{status}</p>
    </div>
  );
}

export default CrossChainENSRecordSetter;