"use client";

import Layout from '@/components/Layout';
import ENSBrowser from '@/components/ENSBrowser';

export default function Browser() {
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-xl font-medium text-gray-900 mb-2">ENS Browser</h1>
        <p className="text-xs text-gray-600 mb-6">
          Search and analyze ENS names, view profiles, track activity, and explore records.
        </p>
        
        <ENSBrowser />
      </div>
    </Layout>
  );
} 