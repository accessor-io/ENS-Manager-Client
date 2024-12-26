"use client";

import { FC, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import logger from '@/utils/logger';

interface Delegate {
  address: string;
  ensName: string;
  votingPower: string;
  proposalsVoted: number;
  delegators: number;
}

const DelegateStats: FC = () => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelegates = async () => {
      try {
        const response = await fetch('/api/delegates');
        if (!response.ok) {
          throw new Error('Failed to fetch delegate data');
        }
        const data = await response.json();
        setDelegates(data.delegates);
        setError(null);
      } catch (err) {
        logger.error('Error fetching delegates', { error: err });
        setError('Failed to load delegate data');
      } finally {
        setLoading(false);
      }
    };

    fetchDelegates();
    const interval = setInterval(fetchDelegates, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Top Delegates</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Top Delegates</h2>
        <div className="text-red-500 text-center py-4">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-2 text-sm text-blue-500 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Top Delegates</h2>
      <div className="space-y-4">
        {delegates.map((delegate) => (
          <div
            key={delegate.address}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">
                  {delegate.ensName || delegate.address}
                </h3>
                <p className="text-sm text-gray-500">
                  {ethers.utils.commify(delegate.votingPower)} votes
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{delegate.proposalsVoted} proposals</p>
                <p>{delegate.delegators} delegators</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DelegateStats; 