"use client";

import { ethers } from 'ethers';

// Contract Addresses
export const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
export const ENS_RESOLVER_ADDRESS = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
export const ENS_BASE_REGISTRAR = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';

// Contract ABIs
export const ENS_REGISTRY_ABI = [
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external',
  'function setResolver(bytes32 node, address resolver) external',
  'function owner(bytes32 node) external view returns (address)',
  'function resolver(bytes32 node) external view returns (address)',
  'event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner)',
  'event Transfer(bytes32 indexed node, address owner)',
  'event NewResolver(bytes32 indexed node, address resolver)',
];

export const ENS_RESOLVER_ABI = [
  'function setAddr(bytes32 node, address addr) external',
  'function setText(bytes32 node, string calldata key, string calldata value) external',
  'function setContenthash(bytes32 node, bytes calldata hash) external',
  'function addr(bytes32 node) external view returns (address)',
  'function text(bytes32 node, string calldata key) external view returns (string memory)',
  'function contenthash(bytes32 node) external view returns (bytes memory)',
  'function multicall(bytes[] calldata data) external returns (bytes[] memory results)',
  'function supportsInterface(bytes4 interfaceID) external pure returns (bool)',
];

// Utility functions
export const namehash = (name) => {
  return ethers.utils.namehash(name);
};

export const labelhash = (label) => {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
};

export const validateName = (name) => {
  return /^[a-z0-9-]+$/.test(name);
};

export const getNamehashAndLabel = (parentDomain, subdomain) => {
  const parentNode = namehash(parentDomain);
  const label = labelhash(subdomain);
  const node = namehash(`${subdomain}.${parentDomain}`);
  return { parentNode, label, node };
};

// Record Types
export const RECORD_TYPES = {
  address: {
    label: 'Wallet Address',
    validate: (value) => ethers.utils.isAddress(value),
    placeholder: '0x...',
    encode: (value) => ['setAddr(bytes32,address)', [value]],
    decode: (value) => value,
  },
  content: {
    label: 'Content Hash (IPFS/Swarm)',
    validate: (value) => value.startsWith('ipfs://') || value.startsWith('bzz://'),
    placeholder: 'ipfs://...',
    encode: (value) => ['setContenthash(bytes32,bytes)', [ethers.utils.toUtf8Bytes(value)]],
    decode: (value) => ethers.utils.toUtf8String(value),
  },
  text: {
    label: 'Text Record',
    validate: () => true,
    placeholder: 'Enter text value',
    encode: (value, key = 'description') => ['setText(bytes32,string,string)', [key, value]],
    decode: (value) => value,
  },
  url: {
    label: 'URL',
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    placeholder: 'https://...',
    encode: (value) => ['setText(bytes32,string,string)', ['url', value]],
    decode: (value) => value,
  },
  email: {
    label: 'Email Address',
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    placeholder: 'user@example.com',
    encode: (value) => ['setText(bytes32,string,string)', ['email', value]],
    decode: (value) => value,
  },
  avatar: {
    label: 'Avatar URL',
    validate: (value) => value.startsWith('https://') || value.startsWith('ipfs://'),
    placeholder: 'https://... or ipfs://...',
    encode: (value) => ['setText(bytes32,string,string)', ['avatar', value]],
    decode: (value) => value,
  },
};

// Contract Interaction Helpers
export const getContracts = (provider) => {
  if (!provider) throw new Error('Provider not available');
  const signer = provider.getSigner();
  
  const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, signer);
  const resolver = new ethers.Contract(ENS_RESOLVER_ADDRESS, ENS_RESOLVER_ABI, signer);
  
  return { registry, resolver };
};

export const createSubdomain = async (provider, parentDomain, subdomain, type, value) => {
  const { registry, resolver } = getContracts(provider);
  const { parentNode, label, node } = getNamehashAndLabel(parentDomain, subdomain);
  
  // Create subdomain with resolver
  const tx1 = await registry.setSubnodeRecord(
    parentNode,
    label,
    await provider.getSigner().getAddress(),
    ENS_RESOLVER_ADDRESS,
    0
  );
  await tx1.wait();

  // Set the record
  const [method, params] = RECORD_TYPES[type].encode(value);
  const tx2 = await resolver[method](node, ...params);
  await tx2.wait();
  
  return { node, label };
};

export const updateRecord = async (provider, name, type, value) => {
  const { resolver } = getContracts(provider);
  const node = namehash(name);
  
  const [method, params] = RECORD_TYPES[type].encode(value);
  const tx = await resolver[method](node, ...params);
  await tx.wait();
};

export const getSubdomains = async (provider, parentDomain) => {
  const { registry, resolver } = getContracts(provider);
  const parentNode = namehash(parentDomain);
  
  // Get historical subdomain creation events
  const filter = registry.filters.NewOwner(parentNode);
  const events = await registry.queryFilter(filter);
  
  return Promise.all(events.map(async (event) => {
    const label = ethers.utils.parseBytes32String(event.args.label);
    const fullName = `${label}.${parentDomain}`;
    const node = namehash(fullName);
    
    const owner = await registry.owner(node);
    const resolverAddress = await registry.resolver(node);
    
    let records = {};
    if (resolverAddress) {
      const customResolver = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI, provider);
      await Promise.all(
        Object.entries(RECORD_TYPES).map(async ([type, { decode }]) => {
          try {
            records[type] = await customResolver[type](node);
            if (records[type]) records[type] = decode(records[type]);
          } catch (e) {
            console.warn(`Failed to get ${type} record for ${fullName}:`, e);
          }
        })
      );
    }

    return {
      name: label,
      fullName,
      owner,
      resolver: resolverAddress,
      records,
      node
    };
  }));
}; 