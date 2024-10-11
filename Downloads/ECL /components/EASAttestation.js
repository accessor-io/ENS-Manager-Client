import React, { useState } from 'react';
import { createAttestation } from '../services/attestationService';

const EASAttestation = ({ provider }) => {
  const [data, setData] = useState('');
  const [attestationResult, setAttestationResult] = useState(null);

  const handleCreateAttestation = async () => {
    const result = await createAttestation(provider, data);
    setAttestationResult(result);
  };

  return (
    <div>
      <h3>EAS Attestation</h3>
      <input
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Enter attestation data"
      />
      <button onClick={handleCreateAttestation}>Create Attestation</button>
      {attestationResult && (
        <p>Attestation Created: {attestationResult}</p>
      )}
    </div>
  );
};

export default EASAttestation;