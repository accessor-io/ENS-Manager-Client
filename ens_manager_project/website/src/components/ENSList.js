"use client";

import React, { useState, useEffect } from 'react';
import { 
  JsonRpcProvider,
  Interface,
  isAddress,
  formatEther,
  zeroPadValue
} from 'ethers';

// ENS Contract Addresses
const ENS_CONTRACTS = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  ethRegistrarController: '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5',
  publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  reverseRegistrar: '0x084b1c3C81545d370f3634392De611CaaBFf8148'
};

const ENSList = ({ searchAddress }) => {
  const [ensActivity, setEnsActivity] = useState([]);
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!searchAddress || !isAddress(searchAddress)) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const provider = new JsonRpcProvider(
          "https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc"
        );

        // Get basic account info
        const [balance, txCount, code, ensName] = await Promise.all([
          provider.getBalance(searchAddress),
          provider.getTransactionCount(searchAddress),
          provider.getCode(searchAddress),
          provider.lookupAddress(searchAddress)
        ]);

        setAccountData({
          balance: formatEther(balance),
          txCount,
          isContract: code !== '0x',
          ensName
        });

        // Get all ENS events
        const fromBlock = 9380471; // ENS deployment block
        const toBlock = 'latest';

        // Create event filters for each contract
        const eventPromises = Object.entries(ENS_CONTRACTS).map(async ([contractType, contractAddress]) => {
          // Create interface for the contract
          const iface = new Interface([
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
            "event NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires)",
            "event NameRenewed(string name, bytes32 indexed label, uint cost, uint expires)"
          ]);

          // Get all relevant logs
          const logs = await provider.getLogs({
            address: contractAddress,
            topics: [
              [
                iface.getEventTopic('Transfer'),
                iface.getEventTopic('NameRegistered'),
                iface.getEventTopic('NameRenewed')
              ],
              null,
              zeroPadValue(searchAddress.toLowerCase(), 32)
            ],
            fromBlock,
            toBlock
          });

          // Parse the logs
          return logs.map(log => {
            try {
              const parsedLog = iface.parseLog({
                topics: log.topics,
                data: log.data
              });
              
              return {
                ...log,
                contractType,
                eventName: parsedLog.name,
                args: parsedLog.args
              };
            } catch (e) {
              console.warn('Failed to parse log:', e);
              return null;
            }
          }).filter(Boolean);
        });

        const allEvents = (await Promise.all(eventPromises)).flat();

        // Sort by block number descending
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);

        // Get block timestamps and transaction details
        const eventsWithDetails = await Promise.all(
          allEvents.map(async (event) => {
            const [block, tx] = await Promise.all([
              provider.getBlock(event.blockNumber),
              provider.getTransaction(event.transactionHash)
            ]);
            return {
              ...event,
              timestamp: block.timestamp,
              value: tx.value ? formatEther(tx.value) : '0'
            };
          })
        );

        console.log('Found events:', eventsWithDetails); // Debug log
        setEnsActivity(eventsWithDetails);
      } catch (err) {
        console.error('Error fetching ENS data:', err);
        setError('Failed to fetch ENS data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchAddress]);

  return (
    <div className="space-y-6">
      {/* Account Info */}
      {accountData && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400">Balance</h3>
              <p className="mt-1 text-lg text-slate-200">
                {parseFloat(accountData.balance).toFixed(4)} ETH
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400">Transaction Count</h3>
              <p className="mt-1 text-lg text-slate-200">
                {accountData.txCount.toLocaleString()}
              </p>
            </div>
            {accountData.ensName && (
              <div>
                <h3 className="text-sm font-medium text-slate-400">ENS Name</h3>
                <p className="mt-1 text-lg text-slate-200">{accountData.ensName}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ENS Activity */}
      {ensActivity.length > 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            ENS Activity ({ensActivity.length} events)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {ensActivity.map((event, index) => (
                  <tr key={index} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(event.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-900/50 text-indigo-300">
                        {event.eventName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {event.contractType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {event.value} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={`https://etherscan.io/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {`${event.transactionHash.slice(0, 6)}...${event.transactionHash.slice(-4)}`}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-3">Fetching ENS activity...</span>
            </div>
          ) : (
            searchAddress ? 'No ENS activity found for this address' : 'Enter an address to view ENS activity'
          )}
        </div>
      )}
    </div>
  );
};

export default ENSList;