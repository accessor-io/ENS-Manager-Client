import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { useENS } from '../utils/hooks';

const ENSAvatar = () => {
  const [ensName, setEnsName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { getAvatar, setAvatar } = useENS();

  const handleFetchAvatar = async () => {
    const fetchedAvatar = await getAvatar(ensName);
    setAvatarUrl(fetchedAvatar);
  };

  const handleSetAvatar = async (newAvatarUrl) => {
    await setAvatar(ensName, newAvatarUrl);
    handleFetchAvatar();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        ENS Avatar
      </Typography>
      <TextField
        fullWidth
        label="ENS Name"
        variant="outlined"
        value={ensName}
        onChange={(e) => setEnsName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleFetchAvatar} sx={{ mb: 2 }}>
        Fetch Avatar
      </Button>
      {avatarUrl && (
        <Box sx={{ mt: 2 }}>
          <img src={avatarUrl} alt="ENS Avatar" style={{ maxWidth: '200px' }} />
        </Box>
      )}
    </Box>
  );
};

export default ENSAvatar;