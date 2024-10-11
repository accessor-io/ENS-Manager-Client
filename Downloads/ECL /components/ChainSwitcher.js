import React from 'react';
import { Button, Typography, Stack } from '@mui/material';
import { useSwitchChain } from '../utils/ethereum';

const ChainSwitcher = () => {
  const switchChain = useSwitchChain();

  const handleSwitch = (chainId) => {
    switchChain(chainId);
  };

  return (
    <Stack spacing={2} direction="row" alignItems="center">
      <Typography variant="h6">Switch Ethereum Network:</Typography>
      <Button variant="contained" onClick={() => handleSwitch(1)}>
        Mainnet
      </Button>
      <Button variant="contained" onClick={() => handleSwitch(3)}>
        Ropsten
      </Button>
      <Button variant="contained" onClick={() => handleSwitch(4)}>
        Rinkeby
      </Button>
      {/* Add more buttons for different networks as needed */}
    </Stack>
  );
};

export default ChainSwitcher;