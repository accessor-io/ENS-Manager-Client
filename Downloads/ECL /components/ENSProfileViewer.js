import React, { useState, useEffect } from 'react';
import { getProfile, getContentHash, resolveENS } from '../utils/ens';

const ENSProfileViewer = ({ ensName }) => {
  const [profile, setProfile] = useState(null);
  const [contentHash, setContentHash] = useState(null);
  const [address, setAddress] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const profileData = await getProfile(ensName);
      const contentHashData = await getContentHash(ensName);
      const addressData = await resolveENS(ensName);
      setProfile(profileData);
      setContentHash(contentHashData);
      setAddress(addressData);
    };
    fetchData();
  }, [ensName]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h2>{ensName} Profile</h2>
      <p>Address: {address}</p>
      <p>Content Hash: {contentHash}</p>
      {Object.entries(profile).map(([key, value]) => (
        value && <p key={key}>{key}: {value}</p>
      ))}
    </div>
  );
};

export default ENSProfileViewer;