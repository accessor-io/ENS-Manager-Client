"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

const ENSTransferPage = () => {
  const [ensName, setEnsName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to transfer ENS names');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get the ENS registry contract
      const registryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
      const registryABI = ['function setOwner(bytes32 node, address owner)'];
      const registry = new ethers.Contract(registryAddress, registryABI, signer);

      // Convert ENS name to namehash
      const namehash = ethers.namehash(ensName);

      // Transfer ownership
      const tx = await registry.setOwner(namehash, recipientAddress);
      await tx.wait();

      setSuccess(`Successfully transferred ${ensName} to ${recipientAddress}`);
      
      // Clear form
      setEnsName('');
      setRecipientAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to transfer ENS name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h1 className="text-2xl font-semibold text-slate-100 mb-6">Transfer ENS Name</h1>
          
          <form onSubmit={handleTransfer} className="space-y-6">
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
              <label htmlFor="recipientAddress" className="block text-sm font-medium text-slate-300 mb-2">
                Recipient Address
              </label>
              <input
                id="recipientAddress"
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
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
                {loading ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ENSTransferPage; 