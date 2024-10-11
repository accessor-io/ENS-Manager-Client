import React from 'react';

const AttestationManager = ({ provider, attestationData, setAttestationData, onCreateAttestation }) => {
  return (
    <div>
      <h3>Attestation Manager</h3>
      <input
        type="text"
        value={attestationData}
        onChange={(e) => setAttestationData(e.target.value)}
        placeholder="Enter attestation data"
      />
      <button onClick={onCreateAttestation}>Create Attestation</button>
    </div>
  );
};

export default AttestationManager;