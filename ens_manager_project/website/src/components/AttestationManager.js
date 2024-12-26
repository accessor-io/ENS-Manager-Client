import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const AttestationManager = ({ provider, onCreateAttestation }) => {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [selectedAttestation, setSelectedAttestation] = useState(null);

  // Fetch attestations
  useEffect(() => {
    const fetchAttestations = async () => {
      if (!provider) return;

      setLoading(true);
      try {
        // Fetch attestations from provider
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Example query - replace with actual implementation
        const attestationEvents = await provider.getLogs({
          // Configure your event filter here
          fromBlock: 'latest',
          toBlock: 'latest'
        });

        const processedAttestations = await Promise.all(
          attestationEvents.map(async (event) => {
            const block = await provider.getBlock(event.blockNumber);
            return {
              id: event.transactionHash,
              timestamp: block.timestamp,
              // Add other attestation details
            };
          })
        );

        setAttestations(processedAttestations);
        generateAnalytics(processedAttestations);
      } catch (error) {
        console.error('Error fetching attestations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttestations();
  }, [provider]);

  // Generate analytics
  const generateAnalytics = (attestationData) => {
    const analytics = {
      total: attestationData.length,
      active: attestationData.filter(a => !a.revoked).length,
      expired: attestationData.filter(a => {
        const expiry = new Date(a.expirationTime * 1000);
        return expiry < new Date();
      }).length,
      byType: {},
      recentActivity: {
        daily: new Array(7).fill(0),
        monthly: new Array(12).fill(0)
      }
    };

    // Process attestations by type
    attestationData.forEach(attestation => {
      if (attestation.schema) {
        analytics.byType[attestation.schema] = (analytics.byType[attestation.schema] || 0) + 1;
      }

      // Process activity timeline
      const date = new Date(attestation.timestamp * 1000);
      const now = new Date();
      const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      const monthDiff = (now.getMonth() - date.getMonth() + 12) % 12;

      if (dayDiff < 7) analytics.recentActivity.daily[dayDiff]++;
      analytics.recentActivity.monthly[monthDiff]++;
    });

    setAnalytics(analytics);
  };

  // Filter attestations
  const getFilteredAttestations = () => {
    let filtered = [...attestations];

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(a => !a.revoked);
        break;
      case 'expired':
        filtered = filtered.filter(a => {
          const expiry = new Date(a.expirationTime * 1000);
          return expiry < new Date();
        });
        break;
      case 'revoked':
        filtered = filtered.filter(a => a.revoked);
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.schema?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      {analytics && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Analytics Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Total Attestations</h4>
              <p className="text-2xl font-bold text-slate-200">{analytics.total}</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Active</h4>
              <p className="text-2xl font-bold text-green-400">{analytics.active}</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Expired</h4>
              <p className="text-2xl font-bold text-yellow-400">{analytics.expired}</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Success Rate</h4>
              <p className="text-2xl font-bold text-indigo-400">
                {analytics.total ? Math.round((analytics.active / analytics.total) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Recent Activity</h4>
            <div className="h-24 flex items-end space-x-2">
              {analytics.recentActivity.daily.map((count, index) => (
                <div key={index} className="flex-1 bg-slate-700/50 rounded-t">
                  <div
                    className="bg-indigo-500/50 rounded-t"
                    style={{
                      height: `${(count / Math.max(...analytics.recentActivity.daily)) * 100}%`,
                      minHeight: count > 0 ? '4px' : '0'
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search attestations..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                       text-slate-200 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            {['all', 'active', 'expired', 'revoked'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attestations List */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Attestations</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : getFilteredAttestations().length > 0 ? (
          <div className="space-y-4">
            {getFilteredAttestations().map((attestation) => (
              <div
                key={attestation.id}
                onClick={() => setSelectedAttestation(attestation)}
                className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/40 
                         transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">
                      {attestation.schema || 'Unknown Schema'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(attestation.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {attestation.revoked && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300">
                        Revoked
                      </span>
                    )}
                    {new Date(attestation.expirationTime * 1000) < new Date() && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                        Expired
                      </span>
                    )}
                    {!attestation.revoked && new Date(attestation.expirationTime * 1000) > new Date() && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No attestations found
          </div>
        )}
      </div>

      {/* Selected Attestation Details */}
      {selectedAttestation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-slate-200">
                Attestation Details
              </h3>
              <button
                onClick={() => setSelectedAttestation(null)}
                className="text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400">Transaction Hash</h4>
                <p className="text-slate-200 font-mono break-all">{selectedAttestation.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400">Schema</h4>
                <p className="text-slate-200">{selectedAttestation.schema || 'Unknown'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400">Recipient</h4>
                <p className="text-slate-200 font-mono">{selectedAttestation.recipient}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400">Status</h4>
                <div className="flex space-x-2 mt-1">
                  {selectedAttestation.revoked ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300">
                      Revoked
                    </span>
                  ) : new Date(selectedAttestation.expirationTime * 1000) < new Date() ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                      Expired
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400">Data</h4>
                <pre className="mt-2 p-4 bg-slate-900 rounded-lg overflow-x-auto text-slate-300 text-sm">
                  {JSON.stringify(selectedAttestation.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttestationManager;