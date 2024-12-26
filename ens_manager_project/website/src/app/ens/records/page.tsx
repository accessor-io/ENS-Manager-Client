"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

const ENSRecordsPage = () => {
  const [ensName, setEnsName] = useState('');
  const [records, setRecords] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

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

  const fetchRecords = async () => {
    if (!ensName) return;

    setLoading(true);
    setError('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to manage ENS records');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const resolver = await provider.getResolver(ensName);
      
      if (!resolver) {
        throw new Error('No resolver found for this ENS name');
      }

      const recordsData: Record<string, string> = {};
      
      // Fetch existing records
      for (const { key } of COMMON_RECORD_KEYS) {
        try {
          const value = await resolver.getText(key);
          if (value) {
            recordsData[key] = value;
          }
        } catch (err) {
          console.error(`Error fetching ${key} record:`, err);
        }
      }

      setRecords(recordsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ENS records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to manage ENS records');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const resolver = await provider.getResolver(ensName);
      
      if (!resolver) {
        throw new Error('No resolver found for this ENS name');
      }

      // Get the resolver contract with write access
      const resolverWithSigner = resolver.connect(signer);

      // Update the text record
      const tx = await resolverWithSigner.setText(newKey, newValue);
      await tx.wait();

      setSuccess(`Successfully added/updated ${newKey} record`);
      
      // Refresh records
      await fetchRecords();
      
      // Clear form
      setNewKey('');
      setNewValue('');
    } catch (err: any) {
      setError(err.message || 'Failed to update ENS record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ensName) {
      fetchRecords();
    }
  }, [ensName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h1 className="text-2xl font-semibold text-slate-100 mb-6">Manage ENS Records</h1>
          
          <div className="mb-8">
            <label htmlFor="ensName" className="block text-sm font-medium text-slate-300 mb-2">
              ENS Name
            </label>
            <div className="flex gap-4">
              <input
                id="ensName"
                type="text"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                placeholder="example.eth"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                         text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={fetchRecords}
                disabled={!ensName || loading}
                className={`px-4 py-2 bg-indigo-600 rounded-lg text-white transition-colors
                         ${loading || !ensName ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              >
                Fetch Records
              </button>
            </div>
          </div>

          {Object.keys(records).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-slate-200 mb-4">Existing Records</h2>
              <div className="grid gap-4">
                {Object.entries(records).map(([key, value]) => (
                  <div key={key} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-sm font-medium text-slate-400 mb-1">{key}</div>
                    <div className="text-slate-200 break-all">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddRecord} className="space-y-6">
            <h2 className="text-lg font-medium text-slate-200">Add/Update Record</h2>
            
            <div>
              <label htmlFor="newKey" className="block text-sm font-medium text-slate-300 mb-2">
                Record Type
              </label>
              <select
                id="newKey"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
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
              <label htmlFor="newValue" className="block text-sm font-medium text-slate-300 mb-2">
                Record Value
              </label>
              <input
                id="newValue"
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
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
                disabled={loading || !ensName}
                className={`px-4 py-2 bg-indigo-600 rounded-lg text-white transition-colors
                         ${loading || !ensName ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              >
                {loading ? 'Adding...' : 'Add/Update Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ENSRecordsPage; 