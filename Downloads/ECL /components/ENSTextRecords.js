import React, { useState } from 'react';
import { TextField, Button, Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import { useENS } from '../utils/hooks';

const ENSTextRecords = () => {
  const [ensName, setEnsName] = useState('');
  const [records, setRecords] = useState({});
  const { getTextRecords, setTextRecord } = useENS();

  const handleFetchRecords = async () => {
    const fetchedRecords = await getTextRecords(ensName);
    setRecords(fetchedRecords);
  };

  const handleSetRecord = async (key, value) => {
    await setTextRecord(ensName, key, value);
    handleFetchRecords(); // Refresh records after setting
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        ENS Text Records
      </Typography>
      <TextField
        fullWidth
        label="ENS Name"
        variant="outlined"
        value={ensName}
        onChange={(e) => setEnsName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleFetchRecords} sx={{ mb: 2 }}>
        Fetch Records
      </Button>
      <List>
        {Object.entries(records).map(([key, value]) => (
          <ListItem key={key}>
            <ListItemText primary={key} secondary={value} />
          </ListItem>
        ))}
      </List>
      {/* Add UI for setting new text records */}
    </Box>
  );
};

export default ENSTextRecords;