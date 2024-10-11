import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getSigner } from '../utils/ethereum';

const SubdomainManager = ({ parentDomain }) => {
  const [subdomain, setSubdomain] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('');

  const createSubdomain = async () => {
    try {
      const signer = await getSigner();
      const registrarContract = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, signer);
      const tx = await registrarContract.setSubnodeOwner(
        ethers.utils.namehash(parentDomain),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(subdomain)),
        owner
      );
      await tx.wait();
      setStatus(`Successfully created subdomain ${subdomain}.${parentDomain}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Subdomain Manager for {parentDomain}</h2>
      <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="Enter subdomain" />
      <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Enter owner address" />
      <button onClick={createSubdomain}>Create Subdomain</button>
      <p>{status}</p>
    </div>
  );
};

export default SubdomainManager;