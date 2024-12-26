import { ethers } from 'ethers';

// Contract addresses
export const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
export const ENS_RESOLVER_ADDRESS = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
export const ENS_BASE_REGISTRAR = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';

// Interfaces
interface SchemaDefinition {
  uid: string;
  name: string;
  description: string;
  schema: string;
  verify: (provider: ethers.providers.Provider, data: any) => Promise<boolean>;
}

interface VerificationResult {
  isValid: boolean;
  message: string;
}

interface BatchVerificationResult extends VerificationResult {
  uid: string;
}

interface AttestationData {
  uid: string;
  schema: string;
  schemaKey: string;
  data: string;
}

// Schema definitions
export const ENS_SCHEMAS: Record<string, SchemaDefinition> = {
  DOMAIN_OWNERSHIP: {
    uid: '0x5c26b3645176c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7c4e',
    name: 'ENS Domain Ownership',
    description: 'Attests to the ownership of an ENS domain',
    schema: 'string domain, uint256 registrationDate, bool isPrimary',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const owner = await registry.owner(ethers.utils.namehash(data.domain));
      return owner === data.attester;
    }
  },

  RESOLVER_VERIFICATION: {
    uid: '0x8c3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7123',
    name: 'ENS Resolver Verification',
    description: 'Verifies the authenticity of an ENS resolver',
    schema: 'string domain, address resolver, bytes32 interfaceID',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const currentResolver = await registry.resolver(ethers.utils.namehash(data.domain));
      return currentResolver === data.resolver;
    }
  },

  SUBDOMAIN_DELEGATION: {
    uid: '0x9a4b2c3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d',
    name: 'Subdomain Delegation',
    description: 'Attests to the delegation of subdomain management rights',
    schema: 'string parentDomain, string subdomain, address delegatee, uint256 permissions',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const node = ethers.utils.namehash(`${data.subdomain}.${data.parentDomain}`);
      const owner = await registry.owner(node);
      return owner === data.delegatee;
    }
  },

  CONTENT_AUTHENTICITY: {
    uid: '0x7b3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7456',
    name: 'Content Record Authenticity',
    description: 'Verifies the authenticity of content records (IPFS, web content)',
    schema: 'string domain, string contentType, string contentHash, uint256 timestamp',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const resolver = await registry.resolver(ethers.utils.namehash(data.domain));
      const resolverContract = new ethers.Contract(resolver, ENS_RESOLVER_ABI, provider);
      const content = await resolverContract.contenthash(ethers.utils.namehash(data.domain));
      return content === data.contentHash;
    }
  },

  REVERSE_RECORD: {
    uid: '0x6a3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7789',
    name: 'Reverse Record Verification',
    description: 'Attests to the authenticity of reverse record claims',
    schema: 'address wallet, string ensName, uint256 verificationDate',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const node = ethers.utils.namehash(`${data.wallet.slice(2)}.addr.reverse`);
      const resolver = await registry.resolver(node);
      const resolverContract = new ethers.Contract(resolver, ENS_RESOLVER_ABI, provider);
      const name = await resolverContract.name(node);
      return name === data.ensName;
    }
  },

  NAME_RENEWAL: {
    uid: '0x4d3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7321',
    name: 'Name Renewal',
    description: 'Attests to the renewal of an ENS name',
    schema: 'string domain, uint256 expiryDate, uint256 renewalCost',
    verify: async (provider, data) => {
      const registrar = new ethers.Contract(ENS_BASE_REGISTRAR, ENS_REGISTRAR_ABI, provider);
      const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data.domain.split('.')[0]));
      const expiry = await registrar.nameExpires(tokenId);
      return expiry.toString() === data.expiryDate.toString();
    }
  },

  MULTI_CHAIN_RESOLUTION: {
    uid: '0x3e3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7654',
    name: 'Multi-Chain Resolution',
    description: 'Attests to cross-chain address resolution settings',
    schema: 'string domain, string chainId, address targetAddress, bool isActive',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const resolver = await registry.resolver(ethers.utils.namehash(data.domain));
      const resolverContract = new ethers.Contract(resolver, ENS_RESOLVER_ABI, provider);
      const addr = await resolverContract['addr(bytes32,uint256)'](
        ethers.utils.namehash(data.domain),
        data.chainId
      );
      return addr === data.targetAddress;
    }
  },

  TEXT_RECORD_AUTH: {
    uid: '0x2d3d15bd1264c9a20f4fad9e775c4d5536c4b4bffac11998df5474d75a8d7987',
    name: 'Text Record Authentication',
    description: 'Attests to the authenticity of text records',
    schema: 'string domain, string key, string value, uint256 timestamp',
    verify: async (provider, data) => {
      const registry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
      const resolver = await registry.resolver(ethers.utils.namehash(data.domain));
      const resolverContract = new ethers.Contract(resolver, ENS_RESOLVER_ABI, provider);
      const text = await resolverContract.text(ethers.utils.namehash(data.domain), data.key);
      return text === data.value;
    }
  }
};

// Utility functions
export const encodeAttestationData = (schema: string, data: any): string => {
  const types = schema.split(', ').map(field => field.split(' ')[0]);
  const values = Object.values(data);
  return ethers.utils.defaultAbiCoder.encode(types, values);
};

export const decodeAttestationData = (schema: string, encodedData: string): Record<string, any> => {
  const types = schema.split(', ').map(field => field.split(' ')[0]);
  const fieldNames = schema.split(', ').map(field => field.split(' ')[1]);
  const decoded = ethers.utils.defaultAbiCoder.decode(types, encodedData);
  
  return fieldNames.reduce((obj, field, index) => {
    obj[field] = decoded[index];
    return obj;
  }, {} as Record<string, any>);
};

export const verifyAttestation = async (
  provider: ethers.providers.Provider,
  schema: string,
  data: any
): Promise<VerificationResult> => {
  try {
    const schemaObj = Object.values(ENS_SCHEMAS).find(s => s.uid === schema);
    if (!schemaObj || !schemaObj.verify) {
      throw new Error('Schema verification not supported');
    }
    
    const isValid = await schemaObj.verify(provider, data);
    return {
      isValid,
      message: isValid ? 'Attestation verified' : 'Attestation verification failed'
    };
  } catch (error) {
    return {
      isValid: false,
      message: error.message
    };
  }
};

export const verifyAttestationBatch = async (
  provider: ethers.providers.Provider,
  attestations: AttestationData[]
): Promise<BatchVerificationResult[]> => {
  const results = await Promise.all(
    attestations.map(async (attestation) => {
      const result = await verifyAttestation(
        provider,
        attestation.schema,
        decodeAttestationData(
          ENS_SCHEMAS[attestation.schemaKey].schema,
          attestation.data
        )
      );
      return {
        uid: attestation.uid,
        ...result
      };
    })
  );
  return results;
}; 