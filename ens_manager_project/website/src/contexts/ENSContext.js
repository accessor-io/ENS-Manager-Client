"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ENS Contract Addresses
export const ENS_CONTRACTS = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  ethRegistrarController: '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5',
  publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  reverseRegistrar: '0x084b1c3C81545d370f3634392De611CaaBFf8148'
};

const ENSContext = createContext(null);

export function ENSProvider({ children }) {
  const [provider, setProvider] = useState(() => 
    new ethers.providers.JsonRpcProvider(
      "https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc"
    )
  );
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ensName, setEnsName] = useState(null);

  // Initialize wallet connection
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;

      try {
        // Check if we have a stored connection
        const storedAddress = localStorage.getItem('walletAddress');
        if (storedAddress) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await web3Provider.listAccounts();
          
          if (accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
            setProvider(web3Provider);
            setAddress(accounts[0]);
            setIsConnected(true);

            // Get ENS name
            try {
              const name = await web3Provider.lookupAddress(accounts[0]);
              setEnsName(name);
            } catch (err) {
              console.warn('Error fetching ENS name:', err);
            }
          } else {
            localStorage.removeItem('walletAddress');
          }
        }
      } catch (err) {
        console.warn('Error checking wallet connection:', err);
      }
    };

    checkConnection();
  }, []);

  // Handle wallet events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected
        setProvider(new ethers.providers.JsonRpcProvider(
          "https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc"
        ));
        setAddress(null);
        setIsConnected(false);
        setEnsName(null);
        localStorage.removeItem('walletAddress');
      } else {
        // Account changed
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        setAddress(accounts[0]);
        setIsConnected(true);
        localStorage.setItem('walletAddress', accounts[0]);

        try {
          const name = await web3Provider.lookupAddress(accounts[0]);
          setEnsName(name);
        } catch (err) {
          console.warn('Error fetching ENS name:', err);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Web3 wallet found');
    }

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const signer = web3Provider.getSigner();
      const userAddress = await signer.getAddress();

      setProvider(web3Provider);
      setAddress(userAddress);
      setIsConnected(true);
      localStorage.setItem('walletAddress', userAddress);

      try {
        const name = await web3Provider.lookupAddress(userAddress);
        setEnsName(name);
      } catch (err) {
        console.warn('Error fetching ENS name:', err);
      }

      return userAddress;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      throw err;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setProvider(new ethers.providers.JsonRpcProvider(
      "https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc"
    ));
    setAddress(null);
    setIsConnected(false);
    setEnsName(null);
    localStorage.removeItem('walletAddress');
  };

  const value = useMemo(() => {
    // Common interfaces
    const registrarInterface = new ethers.utils.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function tokenURI(uint256 tokenId) view returns (string)"
    ]);

    const eventsInterface = new ethers.utils.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      "event NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires)",
      "event NameRenewed(string name, bytes32 indexed label, uint cost, uint expires)",
      "event TextChanged(bytes32 indexed node, string indexed key, string value)",
      "event AddrChanged(bytes32 indexed node, address addr)",
      "event ContenthashChanged(bytes32 indexed node, bytes hash)"
    ]);

    // Create contract instances
    const contracts = {
      registrar: new ethers.Contract(ENS_CONTRACTS.baseRegistrar, registrarInterface, provider),
      registry: new ethers.Contract(ENS_CONTRACTS.registry, ["function resolver(bytes32 node) view returns (address)"], provider),
    };

    return {
      provider,
      contracts,
      interfaces: {
        registrar: registrarInterface,
        events: eventsInterface
      },
      address,
      isConnected,
      ensName,
      connectWallet,
      disconnectWallet
    };
  }, [provider, address, isConnected, ensName]);

  return (
    <ENSContext.Provider value={value}>
      {children}
    </ENSContext.Provider>
  );
}

export function useENS() {
  const context = useContext(ENSContext);
  if (!context) {
    throw new Error('useENS must be used within an ENSProvider');
  }
  return context;
} 