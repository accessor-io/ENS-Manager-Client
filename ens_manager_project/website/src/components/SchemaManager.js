import React, { useState } from 'react';
import { createSchema } from '../utils/customContracts';

const SchemaManager = () => {
  const [schema, setSchema] = useState('');
  const [status, setStatus] = useState('');

  const handleCreateSchema = async () => {
    try {
      const result = await createSchema(schema);
      setStatus(`Schema created. Transaction hash: ${result.transactionHash}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>EAS Schema Manager</h2>
      <textarea 
        value={schema} 
        onChange={(e) => setSchema(e.target.value)} 
        placeholder="Enter schema definition"
      />
      <button onClick={handleCreateSchema}>Create Schema</button>
      <p>{status}</p>
    </div>
  );
};

export default SchemaManager;