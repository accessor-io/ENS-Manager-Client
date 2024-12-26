"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

const CrossChainRecordsPage = () => {
  const [ensName, setEnsName] = useState('');
  const [chainId, setChainId] = useState('1');
  const [recordKey, setRecordKey] = useState('');
  const [recordValue, setRecordValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const SUPPORTED_CHAINS = [
    { id: '1', name: 'Ethereum Mainnet' },
    { id: '137', name: 'Polygon' },
    { id: '10', name: 'Optimism' },
    { id: '42161', name: 'Arbitrum One' }
  ];

  const COMMON_RECORD_KEYS = [
    { key: 'avatar', label: 'Avatar URL' },
    { key: 'email', label: 'Email' },
    { key: 'url', label: 'Website URL' },
    { key: 'description', label: 'Description' },
    { key: 'notice', label: 'Notice' },
    { key: 'keywords', label: 'Keywords' },
    { key: 'com.discord', label: 'Discord' },
    { key: 'com.github', label: 'GitHub' },
    { key: 'com.twitter', label: 'Twitter' },
    { key: 'org.telegram', label: 'Telegram' }
  ];

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to update ENS records');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get the resolver for the ENS name
      const resolver = await provider.getResolver(ensName);
      if (!resolver) {
        throw new Error('No resolver found for this ENS name');
      }

      // Get the resolver contract with write access
      const resolverWithSigner = resolver.connect(signer);

      // Update the text record
      const tx = await resolverWithSigner.setText(recordKey, recordValue);
      await tx.wait();

      setSuccess(`Successfully updated ${recordKey} record for ${ensName}`);
      
      // Clear form
      setRecordValue('');
    } catch (err: any) {
      setError(err.message || 'Failed to update ENS record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h1 className="text-2xl font-semibold text-slate-100 mb-6">Update ENS Records</h1>
          
          <form onSubmit={handleUpdateRecord} className="space-y-6">
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

            <div>
              <label htmlFor="recordKey" className="block text-sm font-medium text-slate-300 mb-2">
                Record Type
              </label>
              <select
                id="recordKey"
                value={recordKey}
                onChange={(e) => setRecordKey(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                         text-slate-200 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a record type</option>
                {COMMON_RECORD_KEYS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="recordValue" className="block text-sm font-medium text-slate-300 mb-2">
                Record Value
              </label>
              <input
                id="recordValue"
                type="text"
                value={recordValue}
                onChange={(e) => setRecordValue(e.target.value)}
                placeholder="Enter the record value"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                         text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
                <p className="text-green-400">{success}</p>
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
                {loading ? 'Updating...' : 'Update Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrossChainRecordsPage; 