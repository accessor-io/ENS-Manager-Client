import React, { useState } from 'react';
import { resolveMultichainAddress, normalizeENSName } from '../utils/ens';

const MultichainResolver = () => {
  const [ensName, setEnsName] = useState('');
  const [coinType, setCoinType] = useState('60'); // Default to ETH
  const [address, setAddress] = useState('');

  const handleResolve = async () => {
    const normalizedName = normalizeENSName(ensName);
    const resolvedAddress = await resolveMultichainAddress(normalizedName, parseInt(coinType));
    setAddress(resolvedAddress || 'Not found');
  };

  return (
    <div>
      <input 
        value={ensName} 
        onChange={(e) => setEnsName(e.target.value)} 
        placeholder="ENS Name"
      />
      <input 
        value={coinType} 
        onChange={(e) => setCoinType(e.target.value)} 
        placeholder="Coin Type (e.g., 60 for ETH)"
      />
      <button onClick={handleResolve}>Resolve</button>
      <p>Resolved Address: {address}</p>
    </div>
  );
};

export default MultichainResolver;