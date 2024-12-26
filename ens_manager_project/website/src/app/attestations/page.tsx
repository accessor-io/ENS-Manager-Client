"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ENS_SCHEMAS, encodeAttestationData, decodeAttestationData } from '@/utils/eas-schemas';

const EAS_CONTRACT_ADDRESS = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia EAS

const EAS_ABI = [
  "function attest(tuple(bytes32 schema, address recipient, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data) request) external payable returns (bytes32)",
  "function getAttestation(bytes32 uid) external view returns (tuple(bytes32 uid, bytes32 schema, address recipient, uint64 time, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data, address attester))",
  "function getRevokeOffchain(bytes32 uid) external view returns (bool)",
];

interface Attestation {
  uid: string;
  schema: string;
  recipient: string;
  time: number;
  expirationTime: number;
  revocable: boolean;
  refUID: string;
  data: string;
  attester: string;
}

// Define event interface and topic
interface AttestedEvent {
  attester: string;
  recipient: string;
  uid: string;
  schema: string;
  revocable: boolean;
}

// The actual Attested event topic from the EAS contract
const ATTESTED_EVENT_TOPIC = '0x1c66532739ce434c54fc128919a2f4a521e8a86d0d0d0da45c0c09fe376c2937';

const AttestationsPage = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSchema, setSelectedSchema] = useState(ENS_SCHEMAS.DOMAIN_OWNERSHIP.uid);
  const [schemaData, setSchemaData] = useState<Record<string, any>>({});
  const [recipient, setRecipient] = useState('');
  const [expirationTime, setExpirationTime] = useState('');
  const [networkInfo, setNetworkInfo] = useState({
    chainId: '',
    blockNumber: '',
    gasPrice: '',
    latency: 0,
    isConnected: false,
    pendingTxs: 0
  });

  // Initialize provider and start network monitoring
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);

          // Start monitoring network status
          monitorNetwork(web3Provider);

          // Listen for network changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });

          window.ethereum.on('accountsChanged', () => {
            window.location.reload();
          });
        } catch (err) {
          console.error('Error initializing provider:', err);
          setError('Failed to connect to wallet');
        }
      }
    };

    initProvider();
  }, []);

  // Monitor network status
  const monitorNetwork = async (provider: ethers.providers.Web3Provider) => {
    try {
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getGasPrice();
      
      // Measure network latency
      const startTime = Date.now();
      await provider.getBlockNumber();
      const latency = Date.now() - startTime;

      setNetworkInfo({
        chainId: network.chainId.toString(),
        blockNumber: blockNumber.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        latency,
        isConnected: true,
        pendingTxs: 0 // This would need a node with pending txs API
      });

      // Set up block listener for real-time updates
      provider.on('block', async (blockNumber) => {
        const gasPrice = await provider.getGasPrice();
        setNetworkInfo(prev => ({
          ...prev,
          blockNumber: blockNumber.toString(),
          gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
        }));
      });
    } catch (err) {
      console.error('Error monitoring network:', err);
      setNetworkInfo(prev => ({ ...prev, isConnected: false }));
    }
  };

  // Add createAttestation function back
  const createAttestation = async () => {
    if (!provider) return;
    setLoading(true);
    setError('');

    try {
      const signer = provider.getSigner();
      const eas = new ethers.Contract(EAS_CONTRACT_ADDRESS, EAS_ABI, signer);

      const selectedSchemaObj = Object.values(ENS_SCHEMAS).find(s => s.uid === selectedSchema);
      if (!selectedSchemaObj) throw new Error('Invalid schema selected');

      const encodedData = encodeAttestationData(selectedSchemaObj.schema, schemaData);

      const request = {
        schema: selectedSchema,
        recipient,
        expirationTime: expirationTime ? Math.floor(new Date(expirationTime).getTime() / 1000) : 0,
        revocable: true,
        refUID: ethers.constants.HashZero,
        data: encodedData,
      };

      const tx = await eas.attest(request);
      await tx.wait();

      setSchemaData({});
      setRecipient('');
      setExpirationTime('');
      fetchAttestations();
    } catch (err: any) {
      console.error('Error creating attestation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update fetchAttestations to handle data type correctly
  const fetchAttestations = async () => {
    if (!provider) return;
    setLoading(true);
    try {
      const eas = new ethers.Contract(EAS_CONTRACT_ADDRESS, EAS_ABI, provider);
      const currentBlock = await provider.getBlockNumber();
      // Fetch last 1000 blocks for attestations
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      const filter = {
        address: EAS_CONTRACT_ADDRESS,
        fromBlock,
        toBlock: 'latest',
        topics: [
          ATTESTED_EVENT_TOPIC
        ]
      };

      console.log('Fetching attestations with filter:', filter);
      const logs = await provider.getLogs(filter);
      console.log('Found logs:', logs);

      const attestationPromises = logs.map(async (log) => {
        // The UID is in the third indexed parameter (index 3)
        const uid = log.topics[3];
        console.log('Fetching attestation for UID:', uid);
        try {
          const attestation = await eas.getAttestation(uid);
          const decodedData = decodeAttestationData(attestation.data);
          
          return {
            uid,
            schema: attestation.schema,
            recipient: attestation.recipient,
            time: attestation.time.toNumber(),
            expirationTime: attestation.expirationTime.toNumber(),
            revocable: attestation.revocable,
            refUID: attestation.refUID,
            data: typeof decodedData === 'string' ? decodedData : JSON.stringify(decodedData),
            attester: attestation.attester
          } as Attestation;
        } catch (err) {
          console.error('Error fetching attestation details:', err);
          return null;
        }
      });

      const fetchedAttestations = (await Promise.all(attestationPromises))
        .filter((a): a is Attestation => a !== null)
        .sort((a, b) => b.time - a.time); // Sort by timestamp, newest first

      console.log('Fetched attestations:', fetchedAttestations);
      setAttestations(fetchedAttestations);
    } catch (err: any) {
      console.error('Error fetching attestations:', err);
      setError('Failed to fetch attestations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attestations on provider change and periodically
  useEffect(() => {
    if (provider) {
      fetchAttestations();
      const interval = setInterval(fetchAttestations, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [provider]);

  // Update network info in the UI
  useEffect(() => {
    if (provider) {
      const updateNetworkInfo = async () => {
        const startTime = Date.now();
        await provider.getBlockNumber();
        const latency = Date.now() - startTime;
        setNetworkInfo(prev => ({ ...prev, latency }));
      };

      const interval = setInterval(updateNetworkInfo, 10000); // Update latency every 10 seconds
      return () => clearInterval(interval);
    }
  }, [provider]);

  // Update the status bar with real network info
  const statusBar = (
    <div className="flex flex-wrap gap-6 items-center">
      <div className="flex-shrink-0 w-48">
        <select className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-300 focus:border-blue-500/50 transition-colors text-sm">
          <option>Ethereum Mainnet</option>
          <option>Sepolia</option>
          <option>Goerli</option>
        </select>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${networkInfo.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-slate-300">{networkInfo.isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Gas:</span>
          <span className="text-sm text-slate-300">{networkInfo.gasPrice} Gwei</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Block:</span>
          <span className="text-sm text-slate-300">#{networkInfo.blockNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Latency:</span>
          <span className={`text-sm ${networkInfo.latency < 100 ? 'text-green-400' : 'text-yellow-400'}`}>
            {networkInfo.latency}ms
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 ml-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Chain ID:</span>
          <span className="text-sm text-slate-300">{networkInfo.chainId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Pending:</span>
          <span className="text-sm text-slate-300">{networkInfo.pendingTxs} txs</span>
        </div>
        <div className="px-3 py-1 bg-blue-500/20 rounded-full">
          <span className="text-sm text-blue-400">
            {networkInfo.latency < 100 ? 'Healthy' : networkInfo.latency < 500 ? 'Degraded' : 'Poor'}
          </span>
        </div>
      </div>
    </div>
  );

  // Replace the old status bar with the new one
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 p-6">
      {/* Top Navigation */}
      <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl mb-6">
        <div className="container mx-auto">
          <div className="flex space-x-4 p-4">
            <button className="px-6 py-2 text-slate-300 hover:text-white hover:bg-blue-600/20 rounded-lg transition-all duration-200">Create</button>
            <button className="px-6 py-2 text-slate-300 hover:text-white hover:bg-blue-600/20 rounded-lg transition-all duration-200">Verify</button>
            <button className="px-6 py-2 text-slate-300 hover:text-white hover:bg-blue-600/20 rounded-lg transition-all duration-200">Batch Process</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto space-y-6">
        {/* System Status Bar */}
        <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg overflow-hidden mb-6">
          <div className="p-4">
            {statusBar}
          </div>
        </div>

        {/* Attestation Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Attestation */}
          <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-medium text-white mb-6">Create Attestation</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Schema Type</div>
                  <select
                    value={selectedSchema}
                    onChange={(e) => setSelectedSchema(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-300 focus:border-blue-500/50 transition-colors"
                  >
                    {Object.entries(ENS_SCHEMAS).map(([key, schema]) => (
                      <option key={schema.uid} value={schema.uid}>
                        {schema.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Recipient</div>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-300 placeholder-slate-500 focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={createAttestation}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Attestation'}
                </button>
              </div>
            </div>
          </div>

          {/* Verify Attestation */}
          <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-medium text-white mb-6">Verify Attestation</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Attestation UID</div>
                  <input
                    type="text"
                    placeholder="Enter attestation UID"
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-300 placeholder-slate-500 focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 py-3 font-medium transition-colors">
                  Verify
                </button>
              </div>
            </div>
          </div>

          {/* Batch Process */}
          <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-medium text-white mb-6">Batch Process</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase mb-2 font-medium">Upload JSON</div>
                  <div className="border-2 border-dashed border-slate-700/50 rounded-lg p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer">
                    <p className="text-sm text-slate-300">Drop your attestation batch file here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                  </div>
                </div>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-3 font-medium transition-colors">
                  Process Batch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Explorer Feed */}
        <div className="bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-white">Explorer Feed</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-slate-900/50 hover:bg-slate-900 text-slate-300 rounded-lg transition-colors text-sm">
                  All Types
                </button>
                <button className="px-4 py-2 bg-slate-900/50 hover:bg-slate-900 text-slate-300 rounded-lg transition-colors text-sm">
                  Latest First
                </button>
              </div>
            </div>

            {/* Attestation Feed */}
            <div className="space-y-4">
              {attestations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-sm text-slate-300">No attestations found</div>
                  <div className="text-xs text-slate-400 mt-1">Create your first attestation to get started</div>
                </div>
              ) : (
                attestations.map((attestation) => (
                  <div
                    key={attestation.uid}
                    className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-slate-200 font-medium">
                          {attestation.recipient.slice(0, 6)}...{attestation.recipient.slice(-4)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(attestation.time * 1000).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-500/20 text-blue-400 rounded-full px-3 py-1">
                          Domain Ownership
                        </span>
                        {attestation.revocable && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 rounded-full px-3 py-1">
                            Revocable
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">{attestation.data}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttestationsPage; 