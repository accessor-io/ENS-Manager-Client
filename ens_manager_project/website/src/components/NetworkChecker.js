import React, { useEffect } from "react";

const NetworkChecker = ({ currentNetwork, supportedNetworks }) => {
  useEffect(() => {
    if (!supportedNetworks.includes(currentNetwork.name.toLowerCase().replace(" ", "_"))) {
      alert("Unsupported network. Please switch to a supported mainnet or testnet.");
    }
  }, [currentNetwork, supportedNetworks]);

  return null;
};

export default NetworkChecker;