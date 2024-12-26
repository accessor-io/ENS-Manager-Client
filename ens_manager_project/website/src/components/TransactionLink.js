import React from "react";
import { NETWORKS } from "../config/networkConfig";

const TransactionLink = ({ txHash, networkName }) => {
  const explorer = NETWORKS[networkName].explorer;
  return (
    <a href={`${explorer}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
      View Transaction
    </a>
  );
};

export default TransactionLink;