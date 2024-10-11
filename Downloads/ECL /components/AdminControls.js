import React from 'react';
import AdminControls from '../components/AdminControls';

const AdminControls = ({ isAdmin, onEdit }) => {
  if (!isAdmin) return null;

  return (
    <button onClick={onEdit}>Edit Attestation</button>
  );
};

export default AdminControls;