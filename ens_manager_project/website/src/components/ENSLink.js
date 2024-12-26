import React from "react";

const ENSLink = ({ ensName, address }) => {
  return (
    <div>
      <h2>ENS Name: {ensName || 'Not set'}</h2>
      <p>Address: {address}</p>
    </div>
  );
};

export default ENSLink;