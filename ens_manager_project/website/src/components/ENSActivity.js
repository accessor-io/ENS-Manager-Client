"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useENS, ENS_CONTRACTS } from '../contexts/ENSContext';

const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const getEventIcon = (type) => {
  switch (type) {
    case 'Transfer':
      return '🔄';
    case 'Registration':
      return '📝';
    case 'Renewal':
      return '🔄';
    default:
      return '📋';
  }
};

const EventCard = ({ event }) => {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={event.type}>
            {getEventIcon(event.type)}
          </span>
          <div>
            <h4 className="text-slate-200 font-medium">{event.type}</h4>
            <p className="text-slate-400 text-sm">{formatDate(event.timestamp)}</p>
          </div>
        </div>
        {event.type === 'Transfer' && (
          <div className="text-right">
            <p className="text-slate-300 text-sm truncate">
              From: {event.from.slice(0, 6)}...{event.from.slice(-4)}
            </p>
            <p className="text-slate-300 text-sm truncate">
              To: {event.to.slice(0, 6)}...{event.to.slice(-4)}
            </p>
          </div>
        )}
        {event.type === 'Registration' && (
          <div className="text-right">
            <p className="text-slate-300 text-sm truncate">
              Owner: {event.owner.slice(0, 6)}...{event.owner.slice(-4)}
            </p>
            <p className="text-slate-300 text-sm truncate">
              Name: {event.name}
            </p>
          </div>
        )}
        {event.type === 'Renewal' && (
          <div className="text-right">
            <p className="text-slate-300 text-sm truncate">
              Token ID: {event.tokenId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ENSActivity = () => {
  const { provider, contracts, interfaces, address: connectedAddress, isConnected } = useENS();
  const [ownedNames, setOwnedNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [nameActivity, setNameActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [activityStats, setActivityStats] = useState(null);

  // Fetch owned ENS names when wallet is connected
  useEffect(() => {
    const fetchOwnedNames = async () => {
      if (!isConnected || !connectedAddress || !ethers.utils.isAddress(connectedAddress)) return;

      setLoading(true);
      setError(null);

      try {
        // Get Transfer events TO this address
        const transferToEvents = await provider.getLogs({
          address: ENS_CONTRACTS.baseRegistrar,
          topics: [
            interfaces.registrar.getEventTopic('Transfer'),
            null,
            null,
            ethers.utils.hexZeroPad(connectedAddress.toLowerCase(), 32)
          ],
          fromBlock: 9380471
        });

        // Get Transfer events FROM this address
        const transferFromEvents = await provider.getLogs({
          address: ENS_CONTRACTS.baseRegistrar,
          topics: [
            interfaces.registrar.getEventTopic('Transfer'),
            null,
            ethers.utils.hexZeroPad(connectedAddress.toLowerCase(), 32),
            null
          ],
          fromBlock: 9380471
        });

        // Get NameRegistered events
        const registeredEvents = await provider.getLogs({
          address: ENS_CONTRACTS.baseRegistrar,
          topics: [
            interfaces.registrar.getEventTopic('NameRegistered'),
            null,
            ethers.utils.hexZeroPad(connectedAddress.toLowerCase(), 32)
          ],
          fromBlock: 9380471
        });

        const allEvents = [...transferToEvents, ...transferFromEvents, ...registeredEvents];
        
        // Process events to get names
        const processedNames = new Set();
        const namePromises = [];
        
        for (const event of allEvents) {
          try {
            if (event.topics[0] === interfaces.registrar.getEventTopic('Transfer')) {
              const tokenId = event.topics[3];
              namePromises.push(
                (async () => {
                  try {
                    const owner = await contracts.registrar.ownerOf(tokenId);
                    if (owner.toLowerCase() === connectedAddress.toLowerCase()) {
                      const label = await contracts.registrar.getLabel(tokenId);
                      return `${label}.eth`;
                    }
                  } catch (err) {
                    console.warn('Error checking name ownership:', err);
                  }
                  return null;
                })()
              );
            }
            else if (event.topics[0] === interfaces.registrar.getEventTopic('NameRegistered')) {
              const parsedLog = interfaces.registrar.parseLog(event);
              const name = `${parsedLog.args.name}.eth`;
              processedNames.add(name);
            }
          } catch (err) {
            console.warn('Error processing event:', err);
          }
        }

        // Wait for all name checks to complete
        const resolvedNames = await Promise.all(namePromises);
        resolvedNames.filter(Boolean).forEach(name => processedNames.add(name));

        setOwnedNames(Array.from(processedNames));

        // Immediately fetch activity for all names
        const activityPromises = Array.from(processedNames).map(name => fetchNameActivity(name));
        const allActivities = await Promise.all(activityPromises);
        
        // Combine all activities
        const combinedActivity = allActivities.flat().sort((a, b) => b.timestamp - a.timestamp);
        setNameActivity(combinedActivity);

        // Generate insights and stats for all activities
        if (combinedActivity.length > 0) {
          const newInsights = generateInsights(combinedActivity);
          setInsights(newInsights);
          const newStats = calculateActivityStats(combinedActivity);
          setActivityStats(newStats);
        }

      } catch (err) {
        console.error('Error fetching owned ENS names:', err);
        setError('Failed to fetch owned ENS names');
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && connectedAddress) {
      fetchOwnedNames();
    } else {
      // Reset state when disconnected
      setOwnedNames([]);
      setSelectedName('');
      setNameActivity([]);
      setInsights(null);
      setActivityStats(null);
    }
  }, [isConnected, connectedAddress, provider, interfaces.registrar, contracts.registrar]);

  const fetchNameActivity = async (name) => {
    if (!name || !provider || !contracts.registry || !contracts.registrar) return;

    setLoading(true);
    setError(null);

    try {
      const registryFilter = contracts.registry.filters.Transfer(null, connectedAddress);
      const registrarFilter = contracts.registrar.filters.NameRegistered(null, connectedAddress);
      const renewalFilter = contracts.registrar.filters.NameRenewed(null, null);

      const [registryEvents, registrarEvents, renewalEvents] = await Promise.all([
        contracts.registry.queryFilter(registryFilter, -10000),
        contracts.registrar.queryFilter(registrarFilter, -10000),
        contracts.registrar.queryFilter(renewalFilter, -10000)
      ]);

      const allEvents = [
        ...registryEvents.map(event => ({
          type: 'Transfer',
          from: event.args.from,
          to: event.args.to,
          tokenId: event.args.tokenId.toString(),
          timestamp: null // Will be populated below
        })),
        ...registrarEvents.map(event => ({
          type: 'Registration',
          owner: event.args.owner,
          name: event.args.name,
          timestamp: null
        })),
        ...renewalEvents.map(event => ({
          type: 'Renewal',
          tokenId: event.args.id.toString(),
          timestamp: null
        }))
      ];

      // Get timestamps for all events
      const timestampPromises = allEvents.map(async (event) => {
        const block = await provider.getBlock(event.blockNumber);
        event.timestamp = block.timestamp;
        return event;
      });

      const eventsWithTimestamps = await Promise.all(timestampPromises);

      // Sort events by timestamp (newest first)
      const sortedEvents = eventsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);

      setNameActivity(sortedEvents);

      // Generate activity stats
      const stats = {
        totalTransfers: registryEvents.length,
        totalRegistrations: registrarEvents.length,
        totalRenewals: renewalEvents.length,
        totalEvents: sortedEvents.length
      };
      setActivityStats(stats);

      // Generate AI insights
      const insights = {
        mostActive: stats.totalEvents > 10 ? 'High activity' : stats.totalEvents > 5 ? 'Moderate activity' : 'Low activity',
        recentActivity: sortedEvents.length > 0 ? 
          `Latest activity: ${sortedEvents[0].type} (${new Date(sortedEvents[0].timestamp * 1000).toLocaleDateString()})` : 
          'No recent activity',
        suggestions: []
      };

      if (stats.totalRenewals === 0) {
        insights.suggestions.push('Consider renewing your names to ensure they don\'t expire');
      }
      if (stats.totalRegistrations > stats.totalTransfers) {
        insights.suggestions.push('You\'re actively growing your ENS portfolio');
      }

      setInsights(insights);

    } catch (err) {
      console.error('Error fetching name activity:', err);
      setError('Failed to fetch name activity');
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity when selected name changes
  useEffect(() => {
    if (selectedName) {
      fetchNameActivity(selectedName);
    }
  }, [selectedName]);

  // New function to analyze events and generate insights
  const generateInsights = (events) => {
    if (!events.length) return null;

    const now = new Date();
    const analysis = {
      totalTransactions: events.length,
      recentActivity: events.filter(e => {
        const eventDate = new Date(e.timestamp * 1000);
        return (now - eventDate) < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }).length,
      eventTypes: {},
      mostActiveTime: null,
      recommendations: []
    };

    // Analyze event types
    events.forEach(event => {
      analysis.eventTypes[event.eventName] = (analysis.eventTypes[event.eventName] || 0) + 1;
    });

    // Find most active time period
    const activityHours = events.map(e => new Date(e.timestamp * 1000).getHours());
    const hourCounts = {};
    activityHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    analysis.mostActiveTime = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Generate recommendations
    if (!analysis.eventTypes['TextChanged']) {
      analysis.recommendations.push('Consider adding text records to enhance your ENS profile');
    }
    if (analysis.recentActivity === 0) {
      analysis.recommendations.push('Your ENS has been inactive. Consider updating your records or renewing if needed');
    }
    if (!analysis.eventTypes['ContenthashChanged']) {
      analysis.recommendations.push('Add a content hash to link your ENS to a decentralized website');
    }

    return analysis;
  };

  // New function to calculate activity statistics
  const calculateActivityStats = (events) => {
    if (!events.length) return null;

    const stats = {
      daily: new Array(7).fill(0),
      monthly: new Array(12).fill(0),
      totalValue: 0
    };

    const now = new Date();
    events.forEach(event => {
      const date = new Date(event.timestamp * 1000);
      const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      const monthDiff = (now.getMonth() - date.getMonth() + 12) % 12;

      if (dayDiff < 7) stats.daily[dayDiff]++;
      stats.monthly[monthDiff]++;

      // Calculate approximate value if available
      if (event.args && event.args.length > 0) {
        const value = ethers.utils.formatEther(event.args[event.args.length - 1] || '0');
        stats.totalValue += parseFloat(value);
      }
    });

    return stats;
  };

  useEffect(() => {
    if (nameActivity.length > 0) {
      const newInsights = generateInsights(nameActivity);
      setInsights(newInsights);
      const newStats = calculateActivityStats(nameActivity);
      setActivityStats(newStats);
    }
  }, [nameActivity]);

  return (
    <div className="space-y-6">
      {!isConnected ? (
        <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Connect Wallet</h3>
          <p className="text-slate-400">
            Connect your wallet to view your ENS activity
          </p>
        </div>
      ) : (
        <>
          {/* Name Selection */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Your ENS Names</h2>
            {ownedNames.length > 0 ? (
              <select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                         text-slate-200 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select an ENS name</option>
                {ownedNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <p className="text-slate-400">
                {loading ? 'Loading your ENS names...' : 'No ENS names found for this address'}
              </p>
            )}
          </div>

          {/* Activity Stats */}
          {activityStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-slate-400 text-sm">Total Events</h4>
                <p className="text-2xl font-semibold text-slate-200">{activityStats.totalEvents}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-slate-400 text-sm">Transfers</h4>
                <p className="text-2xl font-semibold text-slate-200">{activityStats.totalTransfers}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-slate-400 text-sm">Registrations</h4>
                <p className="text-2xl font-semibold text-slate-200">{activityStats.totalRegistrations}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-slate-400 text-sm">Renewals</h4>
                <p className="text-2xl font-semibold text-slate-200">{activityStats.totalRenewals}</p>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {insights && (
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Activity Insights</h3>
              <div className="space-y-4">
                <p className="text-slate-300">{insights.mostActive}</p>
                <p className="text-slate-300">{insights.recentActivity}</p>
                {insights.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-slate-300 font-medium mb-2">Suggestions:</h4>
                    <ul className="list-disc list-inside space-y-2">
                      {insights.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-slate-400">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Events List */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Events</h3>
            <div className="space-y-4">
              {nameActivity.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
              {nameActivity.length === 0 && !loading && (
                <p className="text-center text-slate-400 py-4">No events found</p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-slate-400">Loading...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ENSActivity; 