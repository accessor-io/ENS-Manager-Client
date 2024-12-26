import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { useENS } from '../utils/hooks';

const ENSTransfer = () => {
  const [ensName, setEnsName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [result, setResult] = useState('');
  const { transferENS } = useENS();

  const handleTransfer = async () => {
    const success = await transferENS(ensName, newOwner);
    setResult(success ? 'Transfer successful!' : 'Transfer failed.');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Transfer ENS Name
      </Typography>
      <TextField
        fullWidth
        label="ENS Name"
        variant="outlined"
        value={ensName}
        onChange={(e) => setEnsName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="New Owner Address"
        variant="outlined"
        value={newOwner}
        onChange={(e) => setNewOwner(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleTransfer}>
        Transfer
      </Button>
      {result && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          {result}
        </Typography>
      )}
    </Box>
  );
};

export default ENSTransfer;