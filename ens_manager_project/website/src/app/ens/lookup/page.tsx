import React from 'react';
import ENSSearch from '@/components/ENSSearch';

export default function LookupPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ENS Lookup</h1>
      <ENSSearch />
    </div>
  );
} 