import React, { useState } from 'react';
import { createAttestation, revokeAttestation, getAttestation } from '../utils/customContracts';

const EASInteraction = () => {
  const [schema, setSchema] = useState('');
  const [recipient, setRecipient] = useState('');
  const [expirationTime, setExpirationTime] = useState('');
  const [revocable, setRevocable] = useState(true);
  const [refUID, setRefUID] = useState('');
  const [data, setData] = useState('');
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState('');
  const [attestation, setAttestation] = useState(null);

  const handleCreateAttestation = async () => {
    try {
      const result = await createAttestation(schema, recipient, expirationTime, revocable, refUID, data);
      setStatus(`Attestation created. Transaction hash: ${result.transactionHash}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleRevokeAttestation = async () => {
    try {
      const result = await revokeAttestation(schema, uid);
      setStatus(`Attestation revoked. Transaction hash: ${result.transactionHash}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleGetAttestation = async () => {
    try {
      const result = await getAttestation(uid);
      setAttestation(result);
      setStatus('Attestation retrieved successfully');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>EAS Interaction</h2>
      <div>
        <input placeholder="Schema" value={schema} onChange={(e) => setSchema(e.target.value)} />
        <input placeholder="Recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        <input placeholder="Expiration Time" value={expirationTime} onChange={(e) => setExpirationTime(e.target.value)} />
        <label>
          Revocable:
          <input type="checkbox" checked={revocable} onChange={(e) => setRevocable(e.target.checked)} />
        </label>
        <input placeholder="RefUID" value={refUID} onChange={(e) => setRefUID(e.target.value)} />
        <input placeholder="Data" value={data} onChange={(e) => setData(e.target.value)} />
        <button onClick={handleCreateAttestation}>Create Attestation</button>
      </div>
      <div>
        <input placeholder="UID" value={uid} onChange={(e) => setUid(e.target.value)} />
        <button onClick={handleRevokeAttestation}>Revoke Attestation</button>
        <button onClick={handleGetAttestation}>Get Attestation</button>
      </div>
      <p>{status}</p>
      {attestation && (
        <div>
          <h3>Attestation Details:</h3>
          <pre>{JSON.stringify(attestation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default EASInteraction;