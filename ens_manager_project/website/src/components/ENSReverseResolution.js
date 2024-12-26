import React, { useEffect } from 'react';
import { reverseResolveENS } from '../services/ensService';

const ENSReverseResolution = ({ provider, address, ensName, setEnsName }) => {
  useEffect(() => {
    const resolveReverse = async () => {
      if (provider && address) {
        const name = await reverseResolveENS(provider, address);
        setEnsName(name || '');
      }
    };
    resolveReverse();
  }, [provider, address, setEnsName]);

  return (
    <div>
      <h3>ENS Reverse Resolution</h3>
      <p>Address: {address}</p>
      <p>ENS Name: {ensName || 'Not set'}</p>
    </div>
  );
};

export default ENSReverseResolution;