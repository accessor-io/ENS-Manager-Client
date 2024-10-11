import { useEffect, useState } from "react";
import { getContract } from "../contracts/MyENSContract";

const useENS = (address) => {
  const [ensName, setEnsName] = useState("");

  useEffect(() => {
    const resolveENS = async () => {
      try {
        const contract = getContract();
        const name = await contract.methods.getName(address).call();
        setEnsName(name);
      } catch (error) {
        console.error("ENS resolution error:", error);
      }
    };

    if (address) {
      resolveENS();
    }
  }, [address]);

  return ensName;
};

export default useENS;