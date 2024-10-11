import React, { useState, useEffect } from 'react';
import { Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import { useENS } from '../utils/hooks';

const ENSList = () => {
  const [names, setNames] = useState([]);
  const { listNames } = useENS();

  useEffect(() => {
    const fetchNames = async () => {
      const fetchedNames = await listNames();
      setNames(fetchedNames);
    };
    fetchNames();
  }, [listNames]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your ENS Names
      </Typography>
      <List>
        {names.map((name) => (
          <ListItem key={name}>
            <ListItemText primary={name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ENSList;