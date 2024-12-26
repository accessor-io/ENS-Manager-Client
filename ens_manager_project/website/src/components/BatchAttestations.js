import React, { useState } from 'react';
import { createBatchAttestations } from '../utils/customContracts';

const BatchAttestations = () => {
  const [attestations, setAttestations] = useState([{ schema: '', recipient: '', data: '' }]);
  const [status, setStatus] = useState('');

  const addAttestation = () => {
    setAttestations([...attestations, { schema: '', recipient: '', data: '' }]);
  };

  const updateAttestation = (index, field, value) => {
    const newAttestations = [...attestations];
    newAttestations[index][field] = value;
    setAttestations(newAttestations);
  };

  const handleBatchCreate = async () => {
    try {
      const result = await createBatchAttestations(attestations);
      setStatus(`Batch attestations created. Transaction hash: ${result.transactionHash}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Batch Attestations</h2>
      {attestations.map((att, index) => (
        <div key={index}>
          <input
            value={att.schema}
            onChange={(e) => updateAttestation(index, 'schema', e.target.value)}
            placeholder="Schema"
          />
          <input
            value={att.recipient}
            onChange={(e) => updateAttestation(index, 'recipient', e.target.value)}
            placeholder="Recipient"
          />
          <input
            value={att.data}
            onChange={(e) => updateAttestation(index, 'data', e.target.value)}
            placeholder="Data"
          />
        </div>
      ))}
      <button onClick={addAttestation}>Add Attestation</button>
      <button onClick={handleBatchCreate}>Create Batch Attestations</button>
      <p>{status}</p>
    </div>
  );
};

export default BatchAttestations;