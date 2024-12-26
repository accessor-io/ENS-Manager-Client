"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Network configurations
const NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/your-infura-id',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://etherscan.io'
  },
  5: {
    name: 'Goerli',
    chainId: '0x5',
    rpcUrl: 'https://goerli.infura.io/v3/your-infura-id',
    nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://goerli.etherscan.io'
  },
  11155111: {
    name: 'Sepolia',
    chainId: '0xaa36a7',
    rpcUrl: 'https://sepolia.infura.io/v3/your-infura-id',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  137: {
    name: 'Polygon',
    chainId: '0x89',
    rpcUrl: 'https://polygon-rpc.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorer: 'https://polygonscan.com'
  }
};

const StatusIndicator = ({ status, label }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-2 h-2 rounded-full ${
      status === 'healthy' ? 'bg-emerald-500' :
      status === 'warning' ? 'bg-amber-500' :
      status === 'critical' ? 'bg-red-500' : 'bg-slate-500'
    }`} />
    <span className={`text-xs ${
      status === 'healthy' ? 'text-emerald-400' :
      status === 'warning' ? 'text-amber-400' :
      status === 'critical' ? 'text-red-400' : 'text-slate-400'
    }`}>{label}</span>
  </div>
);

const MetricCard = ({ label, value, unit = '', trend = null }) => (
  <div className="bg-slate-800 rounded p-2">
    <div className="text-xs text-slate-400 mb-1">{label}</div>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-200">{value} {unit}</span>
      {trend && (
        <span className={`text-xs ${
          trend > 0 ? 'text-emerald-400' : 
          trend < 0 ? 'text-red-400' : 
          'text-slate-400'
        }`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

const NetworkSwitcher = ({ currentNetwork, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleNetworkSwitch = async (networkId) => {
    if (!window.ethereum) return;
    
    setSwitching(true);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORKS[networkId].chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: NETWORKS[networkId].chainId,
              chainName: NETWORKS[networkId].name,
              rpcUrls: [NETWORKS[networkId].rpcUrl],
              nativeCurrency: NETWORKS[networkId].nativeCurrency,
              blockExplorerUrls: [NETWORKS[networkId].blockExplorer]
            }],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    } finally {
      setSwitching(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors flex items-center justify-between"
        disabled={switching}
      >
        <span className="flex items-center space-x-2">
          <span className={`h-2 w-2 rounded-full ${switching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{currentNetwork?.name || 'Unknown Network'}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-full rounded-lg shadow-lg bg-slate-900/90 backdrop-blur-lg ring-1 ring-slate-700/50 z-50">
          <div className="py-1">
            {Object.entries(NETWORKS).map(([id, network]) => (
              <button
                key={id}
                onClick={() => handleNetworkSwitch(parseInt(id))}
                className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center space-x-2"
              >
                <span className={`h-2 w-2 rounded-full ${
                  currentNetwork?.chainId === network.chainId ? 'bg-emerald-500' : 'bg-slate-600'
                }`} />
                <span>{network.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NetworkStatus = () => {
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState(null);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [metrics, setMetrics] = useState({
    latency: null,
    gasPrice: null,
    blockTime: null,
    pendingTxs: null,
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        
        try {
          const network = await provider.getNetwork();
          setNetwork(network);
          
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            const balance = await provider.getBalance(accounts[0]);
            setBalance(ethers.utils.formatEther(balance));
          }

          const blockNumber = await provider.getBlockNumber();
          setBlockNumber(blockNumber);
        } catch (error) {
          console.error('Error initializing provider:', error);
        }
      }
    };

    initProvider();

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('accountsChanged', initProvider);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
        window.ethereum.removeListener('accountsChanged', initProvider);
      }
    };
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!provider) return;

      try {
        const startTime = Date.now();
        const [gasPrice, block] = await Promise.all([
          provider.getGasPrice(),
          provider.getBlock('latest')
        ]);
        const latency = Date.now() - startTime;

        const pendingBlock = await provider.send('eth_getBlockTransactionCountByNumber', ['pending']);

        setMetrics({
          latency,
          gasPrice: parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei')).toFixed(2),
          blockTime: block.timestamp - (await provider.getBlock(block.number - 1)).timestamp,
          pendingTxs: parseInt(pendingBlock, 16),
        });

        // Update block number
        setBlockNumber(block.number);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    if (provider) {
      const interval = setInterval(fetchMetrics, 5000);
      fetchMetrics();
      return () => clearInterval(interval);
    }
  }, [provider]);

  useEffect(() => {
    const checkAlerts = () => {
      const newAlerts = [];
      if (metrics.latency > 1000) {
        newAlerts.push({
          type: 'warning',
          message: 'High network latency detected'
        });
      }
      if (metrics.gasPrice > 50) {
        newAlerts.push({
          type: 'critical',
          message: 'Gas prices above threshold'
        });
      }
      if (!address) {
        newAlerts.push({
          type: 'warning',
          message: 'Wallet not connected'
        });
      }
      setAlerts(newAlerts);
    };

    checkAlerts();
  }, [metrics, address]);

  return (
    <div className="space-y-6">
      {/* Network Switcher */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400 mb-3">NETWORK SELECTION</h3>
        <NetworkSwitcher currentNetwork={network} onSwitch={setNetwork} />
      </div>

      {/* System Health Indicators */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400 mb-3">SYSTEM HEALTH</h3>
        <StatusIndicator 
          status={network ? 'healthy' : 'critical'} 
          label="Network Connectivity"
        />
        <StatusIndicator 
          status={metrics.latency < 500 ? 'healthy' : metrics.latency < 1000 ? 'warning' : 'critical'} 
          label="Network Performance"
        />
        <StatusIndicator 
          status={metrics.gasPrice < 30 ? 'healthy' : metrics.gasPrice < 50 ? 'warning' : 'critical'} 
          label="Gas Price Status"
        />
      </div>

      {/* Network Metrics */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400 mb-3">NETWORK METRICS</h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard 
            label="Block Height" 
            value={blockNumber || '--'} 
          />
          <MetricCard 
            label="Gas Price" 
            value={metrics.gasPrice || '--'}
            unit="gwei"
          />
          <MetricCard 
            label="Latency" 
            value={metrics.latency || '--'}
            unit="ms"
          />
          <MetricCard 
            label="Block Time" 
            value={metrics.blockTime || '--'}
            unit="sec"
          />
        </div>
      </div>

      {/* Wallet Status */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400 mb-3">WALLET STATUS</h3>
        <div className="bg-slate-800 rounded p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Connected Address</span>
            <StatusIndicator 
              status={address ? 'healthy' : 'warning'} 
              label={address ? 'Connected' : 'Not Connected'}
            />
          </div>
          {address && balance && (
            <div className="text-sm font-medium text-slate-200">
              {parseFloat(balance).toFixed(4)} ETH
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-slate-400 mb-3">ACTIVE ALERTS</h3>
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`text-xs p-2 rounded ${
                alert.type === 'critical' 
                  ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
                  : 'bg-amber-900/30 text-amber-400 border border-amber-800/50'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Chain Info */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400 mb-3">CHAIN INFO</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Network</span>
            <span className="text-slate-200">
              {network?.name === 'homestead' ? 'Ethereum Mainnet' : network?.name || 'Not Connected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Chain ID</span>
            <span className="text-slate-200">{network?.chainId || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Pending Txs</span>
            <span className="text-slate-200">{metrics.pendingTxs || '--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;