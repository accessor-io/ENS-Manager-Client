"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

const CrossChainResolvePage = () => {
  const [ensName, setEnsName] = useState('');
  const [chainId, setChainId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const SUPPORTED_CHAINS = [
    { id: '1', name: 'Ethereum Mainnet' },
    { id: '137', name: 'Polygon' },
    { id: '10', name: 'Optimism' },
    { id: '42161', name: 'Arbitrum One' }
  ];

  const RPC_URLS: { [key: string]: string } = {
    '1': 'https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc',
    '137': 'https://polygon-mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc',
    '10': 'https://optimism-mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc',
    '42161': 'https://arbitrum-mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc'
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URLS[chainId]);
      
      // Get the resolver for the ENS name
      const resolver = await provider.getResolver(ensName);
      if (!resolver) {
        throw new Error('No resolver found for this ENS name');
      }

      // Get address and text records
      const [address, avatar, email, url, description] = await Promise.all([
        resolver.getAddress(),
        resolver.getText('avatar').catch(() => null),
        resolver.getText('email').catch(() => null),
        resolver.getText('url').catch(() => null),
        resolver.getText('description').catch(() => null)
      ]);

      setResult({
        address,
        records: {
          avatar,
          email,
          url,
          description
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resolve ENS name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h1 className="text-2xl font-semibold text-slate-100 mb-6">Cross-Chain ENS Resolution</h1>
          
          <form onSubmit={handleResolve} className="space-y-6">
            <div>
              <label htmlFor="ensName" className="block text-sm font-medium text-slate-300 mb-2">
                ENS Name
              </label>
              <input
                id="ensName"
                type="text"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                placeholder="example.eth"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                         text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="chainId" className="block text-sm font-medium text-slate-300 mb-2">
                Network
              </label>
              <select
                id="chainId"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                         text-slate-200 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
              >
                {SUPPORTED_CHAINS.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Resolved Address</h3>
                  <p className="text-slate-200 font-mono break-all">{result.address}</p>
                </div>

                {Object.entries(result.records).filter(([_, value]) => value).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">{key}</h3>
                    {key === 'avatar' ? (
                      <img
                        src={value as string}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full bg-slate-700"
                        onError={(e) => (e.target as HTMLElement).style.display = 'none'}
                      />
                    ) : (
                      <p className="text-slate-200 break-all">{value as string}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg 
                         text-slate-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-indigo-600 rounded-lg text-white transition-colors
                         ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              >
                {loading ? 'Resolving...' : 'Resolve'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrossChainResolvePage; 