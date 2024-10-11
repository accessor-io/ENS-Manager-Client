import React, { useState } from 'react';

const ENSResolver = ({ onResolve, resolvedAddress }) => {
  const [ensName, setEnsName] = useState('');

  const handleResolve = () => {
    onResolve(ensName);
  };

  return (
    <div>
      <h3>ENS Resolver</h3>
      <input
        type="text"
        value={ensName}
        onChange={(e) => setEnsName(e.target.value)}
        placeholder="Enter ENS name"
      />
      <button onClick={handleResolve}>Resolve</button>
      {resolvedAddress && <p>Resolved Address: {resolvedAddress}</p>}
    </div>
  );
};

export default ENSResolver;