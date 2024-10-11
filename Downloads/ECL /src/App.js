import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';

import ENSAvatar from './components/ENSAvatar';

const App = () => {
  console.log('App component rendered');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            ENS Manager
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <ENSAvatar />
      </Container>
    </Box>
  );
};

export default App;