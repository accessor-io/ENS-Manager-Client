"use client";

import { FC, ReactNode, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import NewsMarquee from './NewsMarquee';
import DelegateStats from './DelegateStats';

interface LayoutProps {
  children: ReactNode;
}

interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
  icon: string;
}

const SUPPORTED_NETWORKS: NetworkConfig[] = [
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
  }
];

const Layout: FC<LayoutProps> = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(SUPPORTED_NETWORKS[0]);
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        const newProvider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        await newProvider.getNetwork(); // Test connection
        setProvider(newProvider);
      } catch (err) {
        console.error('Failed to initialize provider:', err);
      }
    };

    initProvider();
  }, [currentNetwork]);

  // Handle network change
  const handleNetworkChange = async (network: NetworkConfig) => {
    setCurrentNetwork(network);
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(network.chainId) }],
        });
      } catch (err) {
        console.error('Failed to switch network:', err);
      }
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const userAddress = accounts[0];
      setAddress(userAddress);
      setIsConnected(true);

      // Get ENS name if available
      if (provider) {
        const name = await provider.lookupAddress(userAddress);
        setEnsName(name);
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress(null);
    setEnsName(null);
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Network Selector */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={currentNetwork.name}
                  onChange={(e) => {
                    const network = SUPPORTED_NETWORKS.find(n => n.name === e.target.value);
                    if (network) handleNetworkChange(network);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_NETWORKS.map((network) => (
                    <option key={network.chainId} value={network.name}>
                      {network.icon} {network.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* News Marquee */}
            <div className="flex-1 mx-4">
              <NewsMarquee />
            </div>

            {/* Wallet Connection */}
            <div>
              {isConnected ? (
                <button
                  onClick={disconnectWallet}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Rail */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {/* Navigation items */}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white shadow-sm rounded-lg p-6">
              {children}
            </div>
          </div>

          {/* Right Rail */}
          <div className="w-80 flex-shrink-0">
            <DelegateStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout; 