import React from 'react';
import { Typography, Grid, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import ENSSearch from './ENSSearch';

const Dashboard = () => {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        ENS Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Search
            </Typography>
            <ENSSearch />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Button component={Link} to="/register" variant="contained" sx={{ mr: 1, mb: 1 }}>
              Register New Name
            </Button>
            <Button component={Link} to="/update" variant="contained" sx={{ mr: 1, mb: 1 }}>
              Update Records
            </Button>
            <Button component={Link} to="/transfer" variant="contained" sx={{ mb: 1 }}>
              Transfer Name
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;