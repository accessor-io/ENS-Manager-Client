import React from 'react';
import CrossChainManager from '@/components/CrossChainManager';

export default function CrossChainPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cross-Chain ENS</h1>
      <CrossChainManager />
    </div>
  );
} 