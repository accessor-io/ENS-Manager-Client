import React, { useState } from 'react';
import Web3 from 'web3';

const Registry = ({ contract, account }) => {
  const [registryHash, setRegistryHash] = useState('');
  const [resolverAddress, setResolverAddress] = useState('');

  const register = async () => {
    try {
      await contract.methods.register(Web3.utils.sha3(registryHash), resolverAddress).send({
        from: account
      });
      alert('Registered successfully!');
    } catch (error) {
      console.error(error);
      alert('Error registering');
    }
  };

  const getResolver = async () => {
    try {
      const resolver = await contract.methods.getResolver(Web3.utils.sha3(registryHash)).call();
      setResolverAddress(resolver);
    } catch (error) {
      console.error(error);
      alert('Error getting resolver');
    }
  };

  return (
    <div>
      <h2>Registry</h2>
      <input
        type='text'
        placeholder='Registry Hash'
        value={registryHash}
        onChange={(e) => setRegistryHash(e.target.value)}
      />
      <input
        type='text'
        placeholder='Resolver Address'
        value={resolverAddress}
        onChange={(e) => setResolverAddress(e.target.value)}
      />
      <button onClick={register}>Register</button>
      <button onClick={getResolver}>Get Resolver</button>
    </div>
  );
};

export default Registry;