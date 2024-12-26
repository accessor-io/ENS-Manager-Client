"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const EASAttestation = () => {
  const [loading, setLoading] = useState(false);

  const createAttestation = async () => {
    setLoading(true);
    try {
      // EAS attestation logic will be implemented here
    } catch (err) {
      console.error('Failed to create attestation', err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={createAttestation}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
      >
        {loading ? 'Creating...' : 'Create New Attestation'}
      </button>
      <Link href="/attestations" className="block text-sm text-blue-600 hover:text-blue-800">
        View All Attestations →
      </Link>
    </div>
  );
};

export default EASAttestation;