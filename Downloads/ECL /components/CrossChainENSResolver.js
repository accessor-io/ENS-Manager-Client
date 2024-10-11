import React, { useState } from 'react';
import { resolveENS, lookupAddress } from '../utils/ens';
import { switchChain } from '../utils/ethereum';
import { SUPPORTED_CHAINS, NETWORK_NAMES } from '../config';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { isValidENSName, isValidEthereumAddress } from '../utils/validation';

const CrossChainENSResolver = ({ setError, setLoading }) => {
  const [input, setInput] = useState('');
  const [chainId, setChainId] = useState(1);
  const [result, setResult] = useState('');
  const { error, handleError } = useErrorHandler();

  const handleResolve = async () => {
    setLoading(true);
    try {
      await switchChain(chainId);
      if (isValidENSName(input)) {
        const address = await resolveENS(input);
        setResult(address || 'Not found');
      } else if (isValidEthereumAddress(input)) {
        const name = await lookupAddress(input);
        setResult(name || 'Not found');
      } else {
        setResult('Invalid input');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Cross-Chain ENS Resolver</h2>
      <select value={chainId} onChange={(e) => setChainId(Number(e.target.value))}>
        {SUPPORTED_CHAINS.map(id => (
          <option key={id} value={id}>{NETWORK_NAMES[id]}</option>
        ))}
      </select>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="ENS name or address" />
      <button onClick={handleResolve}>Resolve</button>
      <p>Result: {result}</p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default CrossChainENSResolver;