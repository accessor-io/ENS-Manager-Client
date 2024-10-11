import React from 'react';

const ENSAvatarManager = ({ avatar }) => {
  return (
    <div>
      <h3>ENS Avatar</h3>
      {avatar ? (
        <img src={avatar} alt="ENS Avatar" style={{ width: '100px', height: '100px' }} />
      ) : (
        <p>No avatar set</p>
      )}
    </div>
  );
};

export default ENSAvatarManager;