import React, { useState } from 'react';

const ENSLookup = ({ ensService }) => {
  const [ensName, setEnsName] = useState('');
  const [ensAddress, setEnsAddress] = useState('');

  const lookupENS = async () => {
    if (ensService) {
      const address = await ensService.getAddress(ensName);
      setEnsAddress(address || 'Not found');
    }
  };

  return (
    <div>
      <h2>ENS Lookup</h2>
      <input
        type='text'
        placeholder='ENS Name'
        value={ensName}
        onChange={(e) => setEnsName(e.target.value)}
      />
      <button onClick={lookupENS}>Lookup ENS</button>
      <p>Address: {ensAddress}</p>
    </div>
  );
};

export default ENSLookup;