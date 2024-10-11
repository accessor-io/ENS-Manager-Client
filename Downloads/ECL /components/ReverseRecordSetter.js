import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getSigner } from '../utils/ethereum';

const ReverseRecordSetter = () => {
  const [ensName, setEnsName] = useState('');
  const [status, setStatus] = useState('');

  const setReverseRecord = async () => {
    try {
      const signer = await getSigner();
      const reverseRegistrarContract = new ethers.Contract(REVERSE_REGISTRAR_ADDRESS, REVERSE_REGISTRAR_ABI, signer);
      const tx = await reverseRegistrarContract.setName(ensName);
      await tx.wait();
      setStatus(`Successfully set reverse record to ${ensName}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Set Reverse Record</h2>
      <input value={ensName} onChange={(e) => setEnsName(e.target.value)} placeholder="Enter ENS name" />
      <button onClick={setReverseRecord}>Set Reverse Record</button>
      <p>{status}</p>
    </div>
  );
};

export default ReverseRecordSetter;