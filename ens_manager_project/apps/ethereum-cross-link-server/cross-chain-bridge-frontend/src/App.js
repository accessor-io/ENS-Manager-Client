import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import ConnectComponent from './components/ConnectComponent';
import BridgeActionsComponent from './components/BridgeActionsComponent';

// Import your ABI and contract address
import BridgeABI from './abis/BridgeABI.json';
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accs = await web3Instance.eth.getAccounts();
          setAccounts(accs);

          // Initialize the contract
          const bridgeContract = new web3Instance.eth.Contract(BridgeABI, CONTRACT_ADDRESS);
          setContract(bridgeContract);
        } catch (error) {
          console.error("User denied account access or error occurred:", error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    initWeb3();
  }, []);

  const handleConnect = (account) => {
    setAccounts([account]);
  };

  return (
    <div className="App">
      <h1>Cross-Chain Bridge</h1>
      <ConnectComponent onConnect={handleConnect} />
      {web3 && accounts.length > 0 && contract && (
        <BridgeActionsComponent web3={web3} accounts={accounts} contract={contract} />
      )}
    </div>
  );
}

export default App;
