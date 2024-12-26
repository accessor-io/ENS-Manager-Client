"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

const ENSRegistrationPage = () => {
  const [ensName, setEnsName] = useState('');
  const [duration, setDuration] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);
  const router = useRouter();

  const REGISTRATION_DURATIONS = [
    { value: '1', label: '1 Year' },
    { value: '2', label: '2 Years' },
    { value: '3', label: '3 Years' },
    { value: '4', label: '4 Years' },
    { value: '5', label: '5 Years' }
  ];

  const estimateRegistrationCost = async () => {
    if (!ensName) return;

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to register ENS names');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // ENS Registry contract
      const registrarAddress = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
      const registrarABI = [
        'function rentPrice(string memory name, uint duration) public view returns (uint)',
        'function available(string memory name) public view returns (bool)'
      ];
      const registrar = new ethers.Contract(registrarAddress, registrarABI, provider);

      // Check availability
      const nameWithoutDotEth = ensName.replace('.eth', '');
      const isAvailable = await registrar.available(nameWithoutDotEth);
      
      if (!isAvailable) {
        throw new Error('This ENS name is not available');
      }

      // Get registration cost
      const durationInSeconds = parseInt(duration) * 365 * 24 * 60 * 60;
      const price = await registrar.rentPrice(nameWithoutDotEth, durationInSeconds);
      
      // Convert price from wei to ETH
      const priceInEth = ethers.utils.formatEther(price);
      setEstimatedCost(priceInEth);
    } catch (err: any) {
      setError(err.message || 'Failed to estimate registration cost');
      setEstimatedCost(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to register ENS names');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // ENS Registry contract
      const registrarAddress = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
      const registrarABI = [
        'function register(string calldata name, address owner, uint duration) public payable',
        'function rentPrice(string memory name, uint duration) public view returns (uint)'
      ];
      const registrar = new ethers.Contract(registrarAddress, registrarABI, signer);

      // Calculate duration in seconds
      const durationInSeconds = parseInt(duration) * 365 * 24 * 60 * 60;
      
      // Get registration cost
      const nameWithoutDotEth = ensName.replace('.eth', '');
      const price = await registrar.rentPrice(nameWithoutDotEth, durationInSeconds);

      // Register the name
      const tx = await registrar.register(
        nameWithoutDotEth,
        await signer.getAddress(),
        durationInSeconds,
        { value: price }
      );
      await tx.wait();

      setSuccess(`Successfully registered ${ensName} for ${duration} year(s)`);
      
      // Clear form
      setEnsName('');
      setDuration('1');
      setEstimatedCost(null);
    } catch (err: any) {
      setError(err.message || 'Failed to register ENS name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h1 className="text-2xl font-semibold text-slate-100 mb-6">Register ENS Name</h1>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="ensName" className="block text-sm font-medium text-slate-300 mb-2">
                ENS Name
              </label>
              <div className="flex gap-4">
                <input
                  id="ensName"
                  type="text"
                  value={ensName}
                  onChange={(e) => {
                    setEnsName(e.target.value);
                    setEstimatedCost(null);
                  }}
                  placeholder="example.eth"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                           text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                           focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={estimateRegistrationCost}
                  disabled={!ensName || loading}
                  className={`px-4 py-2 bg-slate-700 rounded-lg text-white transition-colors
                           ${!ensName || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
                >
                  Check Price
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-2">
                Registration Duration
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setEstimatedCost(null);
                }}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg 
                         text-slate-200 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {REGISTRATION_DURATIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {estimatedCost && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-slate-300">
                  Estimated Cost: <span className="text-indigo-400 font-medium">{estimatedCost} ETH</span>
                </p>
              </div>
            )}

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
                disabled={loading || !ensName || !estimatedCost}
                className={`px-4 py-2 bg-indigo-600 rounded-lg text-white transition-colors
                         ${loading || !ensName || !estimatedCost ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ENSRegistrationPage; 