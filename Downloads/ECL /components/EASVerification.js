import React, { useState } from 'react';
import { verifyAttestation } from '../services/attestationService';

const EASVerification = ({ provider }) => {
  const [attestationId, setAttestationId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    const result = await verifyAttestation(provider, attestationId);
    setVerificationResult(result);
  };

  return (
    <div>
      <h3>EAS Verification</h3>
      <input
        type="text"
        value={attestationId}
        onChange={(e) => setAttestationId(e.target.value)}
        placeholder="Enter attestation ID"
      />
      <button onClick={handleVerify}>Verify</button>
      {verificationResult !== null && (
        <p>Verification Result: {verificationResult ? 'Valid' : 'Invalid'}</p>
      )}
    </div>
  );
};

export default EASVerification;