import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RegistryABI from './Registry.json'; // Ensure this file exists and is correctly formatted
import ResolverABI from './Resolver.json'; // Ensure this file exists and is correctly formatted
import './styles.css';
import Loader from './Loader';

function App() {
    const [addresses, setAddresses] = useState([]);
    const [uid, setUid] = useState('');
    const [hash, setHash] = useState('');
    const [resolverAddress, setResolverAddress] = useState('');
    const [registryContract, setRegistryContract] = useState(null);
    const [resolverContract, setResolverContract] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        async function init() {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send('eth_requestAccounts', []);
                const signer = await provider.getSigner();

                const registryAddress = 'YOUR_REGISTRY_CONTRACT_ADDRESS'; // Replace with deployed registry contract address
                const registry = new ethers.Contract(registryAddress, RegistryABI, signer);
                setRegistryContract(registry);
            } catch (err) {
                setError('Failed to connect to wallet');
                console.error(err);
            }
        }
        init();
    }, []);

    const addAddressField = () => {
        setAddresses([...addresses, { address: '', detail: '' }]);
    };

    const handleAddressChange = (index, field, value) => {
        const newAddresses = addresses.map((item, i) => (
            i === index ? { ...item, [field]: value } : item
        ));
        setAddresses(newAddresses);
    };

    const generateUID = () => {
        const hash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address[]'], [addresses.map(a => a.address)]));
        setUid(hash);
    };

    const fetchResolver = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            if (!registryContract) throw new Error('Registry contract is not set');
            const resolver = await registryContract.getResolver(hash);
            setResolverAddress(resolver);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const resolverContract = new ethers.Contract(resolver, ResolverABI, signer);
            setResolverContract(resolverContract);
            setSuccess('Resolver fetched successfully');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addAddress = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            if (!resolverContract) throw new Error('Resolver contract is not set');
            for (const { address, detail } of addresses) {
                const tx = await resolverContract.addAddress(hash, address, detail);
                await tx.wait();
            }
            setSuccess('Addresses added successfully');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <header>
                <h1>ENS Management and Attestation Group Interface</h1>
                <p>Manage your Ethereum Name Service (ENS) domains easily and handle address attestations</p>
            </header>
            <div className="container">
                <button onClick={addAddressField}>Add Address</button>
                {addresses.map((item, index) => (
                    <div key={index} className="address-input">
                        <input
                            type="text"
                            placeholder="Enter address"
                            value={item.address}
                            onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Enter detail"
                            value={item.detail}
                            onChange={(e) => handleAddressChange(index, 'detail', e.target.value)}
                        />
                    </div>
                ))}
                <button onClick={generateUID}>Generate UID</button>
                <p>UID: {uid}</p>
                <input
                    type="text"
                    placeholder="Enter hash"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                />
                <button onClick={fetchResolver} disabled={loading}>Fetch Resolver</button>
                <button onClick={addAddress} disabled={loading}>Add Address</button>
                <p>Resolver Address: {resolverAddress}</p>
                {loading && <Loader />}
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </div>
        </div>
    );
}

export default App;
