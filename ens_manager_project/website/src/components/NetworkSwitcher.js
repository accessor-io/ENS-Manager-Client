import React from "react";
import { NETWORKS } from "../config/networkConfig";
import Web3 from "web3";

const NetworkSwitcher = ({ setNetwork }) => {
  const handleChange = async (event) => {
    const selectedNetwork = NETWORKS[event.target.value];
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: Web3.utils.toHex(selectedNetwork.chainId) }],
      });
      setNetwork(selectedNetwork);
    } catch (switchError) {
      if (switchError.code === 4902) {
        // If the chain has not been added to MetaMask, add it
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: Web3.utils.toHex(selectedNetwork.chainId),
                chainName: selectedNetwork.name,
                rpcUrls: [selectedNetwork.rpcUrl],
                blockExplorerUrls: [selectedNetwork.explorer],
              },
            ],
          });
          setNetwork(selectedNetwork);
        } catch (addError) {
          console.error(addError);
        }
      } else {
        console.error(switchError);
      }
    }
  };

  return (
    <select onChange={handleChange}>
      {Object.keys(NETWORKS).map((key) => (
        <option key={key} value={key}>
          {NETWORKS[key].name}
        </option>
      ))}
    </select>
  );
};

export default NetworkSwitcher;