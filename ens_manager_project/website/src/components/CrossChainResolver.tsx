"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  ensRegistry?: string;
  explorer: string;
  icon: string;
}

const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc',
    explorer: 'https://etherscan.io',
    icon: '🌐'
  },
  {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    icon: '⬡'
  },
  {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    icon: '🔷'
  },
  {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    icon: '🔴'
  },
  {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    icon: '🔵'
  }
];

interface Resolution {
  chain: string;
  address: string | null;
  reverseRecord: string | null;
  timestamp: Date;
  error?: string;
}

export default function CrossChainResolver() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isValidInput, setIsValidInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{ [key: string]: ethers.providers.JsonRpcProvider }>({});
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [searchType, setSearchType] = useState<'name' | 'address'>('name');

  // Initialize providers
  useEffect(() => {
    const initProviders = async () => {
      const newProviders: { [key: string]: ethers.providers.JsonRpcProvider } = {};
      
      for (const chain of SUPPORTED_CHAINS) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);
          // Test connection
          await provider.getNetwork();
          newProviders[chain.name] = provider;
        } catch (err) {
          console.error(`Failed to initialize ${chain.name} provider:`, err);
        }
      }
      
      setProviders(newProviders);
    };

    initProviders();
  }, []);

  // Validate input based on search type
  const validateInput = (value: string): boolean => {
    if (searchType === 'name') {
      const ensRegex = /^([a-z0-9-]+\.)*[a-z0-9-]+\.eth$/;
      return ensRegex.test(value);
    } else {
      return ethers.utils.isAddress(value);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setIsValidInput(value === '' || validateInput(value));
  };

  const resolveAcrossChains = async () => {
    if (!isValidInput || !searchQuery) return;

    setLoading(true);
    setError(null);
    setResolutions([]);

    const newResolutions: Resolution[] = [];
    const promises = Object.entries(providers).map(async ([chainName, provider]) => {
      try {
        let address: string | null = null;
        let reverseRecord: string | null = null;

        if (searchType === 'name') {
          // Forward resolution
          address = await provider.resolveName(searchQuery);
          if (address) {
            // Try reverse resolution
            reverseRecord = await provider.lookupAddress(address);
          }
        } else {
          // Start with reverse resolution
          reverseRecord = await provider.lookupAddress(searchQuery);
          address = searchQuery;
        }

        newResolutions.push({
          chain: chainName,
          address,
          reverseRecord,
          timestamp: new Date()
        });
      } catch (err) {
        newResolutions.push({
          chain: chainName,
          address: null,
          reverseRecord: null,
          timestamp: new Date(),
          error: err instanceof Error ? err.message : 'Resolution failed'
        });
      }
    });

    await Promise.all(promises);
    
    // Sort resolutions to show successful ones first
    setResolutions(newResolutions.sort((a, b) => {
      if (a.address && !b.address) return -1;
      if (!a.address && b.address) return 1;
      return 0;
    }));
    
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSearchType('name')}
            className={`px-4 py-2 text-xs font-medium rounded-md ${
              searchType === 'name'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ENS Name
          </button>
          <button
            onClick={() => setSearchType('address')}
            className={`px-4 py-2 text-xs font-medium rounded-md ${
              searchType === 'address'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Ethereum Address
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={searchType === 'name' ? 'Enter ENS name (e.g., vitalik.eth)' : 'Enter Ethereum address (0x...)'}
            className={`w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
              isValidInput 
                ? 'border-gray-200 focus:ring-blue-500' 
                : 'border-red-300 focus:ring-red-500'
            }`}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && resolveAcrossChains()}
          />
          <button
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 text-xs text-white rounded-md transition-colors ${
              isValidInput && searchQuery
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={resolveAcrossChains}
            disabled={!isValidInput || !searchQuery || loading}
          >
            {loading ? 'Resolving...' : 'Resolve'}
          </button>
        </div>
        {!isValidInput && searchQuery && (
          <p className="mt-1 text-xs text-red-500">
            {searchType === 'name' 
              ? 'Please enter a valid ENS name (e.g., name.eth)'
              : 'Please enter a valid Ethereum address'
            }
          </p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {resolutions.length > 0 && (
        <div className="space-y-4">
          {resolutions.map((resolution, index) => (
            <div
              key={resolution.chain}
              className={`bg-white border border-gray-200 rounded-lg p-4 ${
                resolution.address ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{SUPPORTED_CHAINS.find(c => c.name === resolution.chain)?.icon}</span>
                  <h3 className="text-sm font-medium text-gray-900">{resolution.chain}</h3>
                </div>
                <span className="text-xs text-gray-500">
                  {resolution.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {resolution.error ? (
                <p className="text-xs text-red-500">{resolution.error}</p>
              ) : (
                <div className="space-y-2">
                  {resolution.address && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Address</span>
                      <a
                        href={`${SUPPORTED_CHAINS.find(c => c.name === resolution.chain)?.explorer}/address/${resolution.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-blue-600 hover:text-blue-800 break-all"
                      >
                        {resolution.address}
                      </a>
                    </div>
                  )}
                  {resolution.reverseRecord && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Reverse Record</span>
                      <span className="text-xs font-medium text-gray-900 break-all">
                        {resolution.reverseRecord}
                      </span>
                    </div>
                  )}
                  {!resolution.address && !resolution.reverseRecord && (
                    <p className="text-xs text-gray-500">No resolution found</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 