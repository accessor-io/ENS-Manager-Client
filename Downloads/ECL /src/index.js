import React, { useState, useEffect } from 'react';
import { connectToEthereum } from './services/ethereumService';
import { reverseResolveENS } from './services/ensService';

// Import all components
import { AdminControls } from './components/AdminControls';
import { AttestationManager } from './components/AttestationManager';
import { BatchAttestations } from './components/BatchAttestations';
import ChainSelector from './components/ChainSelector';
import { ChainSwitcher } from './components/ChainSwitcher';
import  CrossChainCommunication from './components/CrossChainCommunication';
import { CrossChainENSRecordSetter } from './components/CrossChainENSRecordSetter';
import { CrossChainENSResolver } from './components/CrossChainENSResolver';
import { CurrentNetwork } from './components/CurrentNetwork';
import { Dashboard } from './components/Dashboard';
import { EASAttestation } from './components/EASAttestation';
import { EASInteraction } from './components/EASInteraction';
import { EASVerification } from './components/EASVerification';
import { ENSAvatar } from './components/ENSAvatar';
import { ENSAvatarManager } from './components/ENSAvatarManager';
import { ENSLink } from './components/ENSLink';
import { ENSList } from './components/ENSList';
import { ENSProfileViewer } from './components/ENSProfileViewer';
import  ENSRegistration  from './components/ENSRegistration';
import { ENSResolver } from './components/ENSResolver';
import { ENSReverseResolution } from './components/ENSReverseResolution';
import  ENSSearch  from './components/ENSSearch';
import { ENSTextRecords } from './components/ENSTextRecords';
import { ENSTransfer } from './components/ENSTransfer';
import  ErrorHandler  from './components/ErrorHandler';
import { EthereumLogin } from './components/EthereumLogin';
import { FeedbackForm } from './components/FeedbackForm';
import { Footer } from './components/Footer';
import  Header  from './components/Header';
import  LoadingSpinner  from './components/LoadingSpinner';
import { MultichainResolver } from './components/MultichainResolver';
import { MultiStepForm } from './components/MultiStepForm';
import { NameManagement } from './components/NameManagement';
import  Navigation  from './components/Navigation';
import { NetworkChecker } from './components/NetworkChecker';
import { NetworkStatus } from './components/NetworkStatus';
import { NetworkSwitcher } from './components/NetworkSwitcher';
import { Profile } from './components/Profile';
import { ReverseRecordSetter } from './components/ReverseRecordSetter';
import { SchemaManager } from './components/SchemaManager';
import { Search } from './components/Search';
import { Staking } from './components/Staking';
import { SubdomainManager } from './components/SubdomainManager';
import  TextRecordSetter  from './components/TextRecordSetter';
import { TransactionLink } from './components/TransactionLink';
import { WalletConnector } from './components/WalletConnector';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [ensName, setEnsName] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { 
    const init = async () => {
      try {
        setLoading(true);
        const provider = await connectToEthereum();
        setProvider(provider);
        if (provider) {
          const network = await provider.getNetwork();
          setCurrentNetwork(network.name);
          const signer = provider.getSigner();
          setSigner(signer);
          const address = await signer.getAddress();
          setAddress(address);
          const name = await reverseResolveENS(provider, address);
          setEnsName(name || '');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorHandler error={error} />;

  return (
    <div className="App">
      <Header />
      <Navigation />
      <WalletConnector setProvider={setProvider} setSigner={setSigner} setAddress={setAddress} />
      <CurrentNetwork network={currentNetwork} />
      <NetworkChecker />
      <NetworkSwitcher />
      <ChainSelector />
      <ChainSwitcher />
      
      <main>
        <Dashboard address={address} ensName={ensName} />
        <Profile address={address} ensName={ensName} />
        
        <section className="ens-management">
          <h2>ENS Management</h2>
          <ENSProfileViewer provider={provider} address={address} ensName={ensName} />
          <ENSRegistration provider={provider} signer={signer} />
          <ENSTransfer provider={provider} signer={signer} />
          <ENSTextRecords provider={provider} signer={signer} ensName={ensName} />
          <ENSReverseResolution provider={provider} address={address} ensName={ensName} setEnsName={setEnsName} />
          <ENSAvatar provider={provider} ensName={ensName} />
          <ENSAvatarManager provider={provider} ensName={ensName} />
          <ENSLink ensName={ensName} address={address} />
          <ENSList provider={provider} />
          <ENSResolver provider={provider} />
          <ENSSearch provider={provider} />
          <ReverseRecordSetter provider={provider} signer={signer} address={address} />
          <SubdomainManager provider={provider} signer={signer} ensName={ensName} />
          <TextRecordSetter provider={provider} signer={signer} ensName={ensName} />
          <NameManagement provider={provider} signer={signer} ensName={ensName} />
        </section>
        
        <section className="eas-management">
          <h2>EAS Management</h2>
          <EASAttestation provider={provider} signer={signer} />
          <EASVerification provider={provider} />
          <EASInteraction provider={provider} signer={signer} />
          <AttestationManager provider={provider} signer={signer} />
          <BatchAttestations provider={provider} signer={signer} />
          <SchemaManager provider={provider} signer={signer} />
        </section>
        
        <section className="cross-chain">
          <h2>Cross-Chain Operations</h2>
          <CrossChainENSResolver provider={provider} />
          <CrossChainENSRecordSetter provider={provider} signer={signer} />
          <CrossChainCommunication provider={provider} signer={signer} />
          <MultichainResolver provider={provider} />
        </section>
        
        <section className="additional-features">
          <h2>Additional Features</h2>
          <Search />
          <Staking provider={provider} signer={signer} />
          <MultiStepForm />
          <FeedbackForm />
        </section>
      </main>
      
      <AdminControls isAdmin={true} onEdit={() => console.log('Edit')} />
      <TransactionLink hash="0x..." />
      <Footer />
    </div>
  );
}

export default App;