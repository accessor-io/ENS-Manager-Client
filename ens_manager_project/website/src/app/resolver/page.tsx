"use client";

import Layout from '@/components/Layout';
import CrossChainResolver from '@/components/CrossChainResolver';

export default function Resolver() {
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-xl font-medium text-gray-900 mb-2">Cross-Chain Name Resolver</h1>
        <p className="text-xs text-gray-600 mb-6">
          Resolve ENS names and Ethereum addresses across multiple networks including Ethereum, Polygon, Arbitrum, Optimism, and Base.
        </p>
        
        <CrossChainResolver />
      </div>
    </Layout>
  );
} 