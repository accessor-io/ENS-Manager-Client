import React, { useState } from 'react';

const ENSReverseLookup = ({ ensService }) => {
  const [ensAddress, setEnsAddress] = useState('');
  const [ensName, setEnsName] = useState('');

  const reverseLookupENS = async () => {
    if (ensService) {
      const name = await ensService.getName(ensAddress);
      setEnsName(name || 'Not found');
    }
  };

  return (
    <div>
      <h2>ENS Reverse Lookup</h2>
      <input
        type='text'
        placeholder='Ethereum Address'
        value={ensAddress}
        onChange={(e) => setEnsAddress(e.target.value)}
      />
      <button onClick={reverseLookupENS}>Reverse Lookup ENS</button>
      <p>Name: {ensName}</p>
    </div>
  );
};

export default ENSReverseLookup;