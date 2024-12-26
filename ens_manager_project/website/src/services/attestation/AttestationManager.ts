import { ethers } from 'ethers';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ProjectStandards, StandardsEnforcer } from '@/config/standards';
import structlog from 'structlog';

// EAS Contract addresses for different networks
const EAS_CONTRACT_ADDRESSES = {
  mainnet: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
  sepolia: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
  // Add more networks as needed
};

// Schema for asset attestations
const ASSET_SCHEMA = {
  schema: 'address asset,uint256 chainId,string assetType,string metadata,address owner',
  revocable: true
};

export interface AssetAttestation {
  asset: string;
  chainId: number;
  assetType: string;
  metadata: string;
  owner: string;
}

export class AttestationManager {
  private readonly eas: EAS;
  private readonly provider: ethers.providers.Provider;
  private readonly signer?: ethers.Signer;
  private readonly logger: any;
  private readonly schemaUID: string;

  constructor(
    provider: ethers.providers.Provider,
    networkName: string = 'mainnet',
    signer?: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
    this.logger = structlog.getLogger().bind({
      service: 'attestation-manager',
      version: '1.0.0'
    });

    const easAddress = EAS_CONTRACT_ADDRESSES[networkName];
    if (!easAddress) {
      throw new Error(`Network ${networkName} not supported`);
    }

    this.eas = new EAS(easAddress);
    this.eas.connect(provider);

    // Initialize schema
    this.schemaUID = this.generateSchemaUID();
  }

  /**
   * Generate a unique schema UID for asset attestations
   */
  private generateSchemaUID(): string {
    const schemaEncoder = new SchemaEncoder(ASSET_SCHEMA.schema);
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['string', 'bool'],
        [ASSET_SCHEMA.schema, ASSET_SCHEMA.revocable]
      )
    );
  }

  /**
   * Create a new asset attestation
   */
  async createAttestation(attestation: AssetAttestation): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for creating attestations');
    }

    try {
      // Validate inputs
      if (!StandardsEnforcer.validateAddress(attestation.asset)) {
        throw new Error('Invalid asset address');
      }
      if (!StandardsEnforcer.validateAddress(attestation.owner)) {
        throw new Error('Invalid owner address');
      }

      const startTime = Date.now();
      
      // Encode attestation data
      const schemaEncoder = new SchemaEncoder(ASSET_SCHEMA.schema);
      const encodedData = schemaEncoder.encodeData([
        { name: 'asset', value: attestation.asset, type: 'address' },
        { name: 'chainId', value: attestation.chainId, type: 'uint256' },
        { name: 'assetType', value: attestation.assetType, type: 'string' },
        { name: 'metadata', value: attestation.metadata, type: 'string' },
        { name: 'owner', value: attestation.owner, type: 'address' }
      ]);

      // Create attestation
      const tx = await this.eas.connect(this.signer).attest({
        schema: this.schemaUID,
        data: {
          recipient: attestation.owner,
          expirationTime: 0, // No expiration
          revocable: true,
          data: encodedData
        }
      });

      const receipt = await tx.wait();
      
      this.logger.info('attestation_created', {
        asset: attestation.asset,
        chainId: attestation.chainId,
        owner: attestation.owner,
        duration: Date.now() - startTime,
        transactionHash: receipt.transactionHash
      });

      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('attestation_creation_failed', {
        error: error.message,
        asset: attestation.asset,
        chainId: attestation.chainId
      });
      throw error;
    }
  }

  /**
   * Get all attestations for an asset
   */
  async getAssetAttestations(asset: string): Promise<AssetAttestation[]> {
    try {
      if (!StandardsEnforcer.validateAddress(asset)) {
        throw new Error('Invalid asset address');
      }

      const filter = await this.eas.getAttestationsBySchema(this.schemaUID);
      const attestations = await filter.where('asset').equals(asset).exec();

      return attestations.map(att => {
        const decoded = this.decodeAttestationData(att.data);
        return {
          asset: decoded.asset,
          chainId: decoded.chainId.toNumber(),
          assetType: decoded.assetType,
          metadata: decoded.metadata,
          owner: att.recipient
        };
      });
    } catch (error) {
      this.logger.error('get_attestations_failed', {
        error: error.message,
        asset
      });
      throw error;
    }
  }

  /**
   * Get all attestations for an owner
   */
  async getOwnerAttestations(owner: string): Promise<AssetAttestation[]> {
    try {
      if (!StandardsEnforcer.validateAddress(owner)) {
        throw new Error('Invalid owner address');
      }

      const filter = await this.eas.getAttestationsBySchema(this.schemaUID);
      const attestations = await filter.where('recipient').equals(owner).exec();

      return attestations.map(att => {
        const decoded = this.decodeAttestationData(att.data);
        return {
          asset: decoded.asset,
          chainId: decoded.chainId.toNumber(),
          assetType: decoded.assetType,
          metadata: decoded.metadata,
          owner: att.recipient
        };
      });
    } catch (error) {
      this.logger.error('get_owner_attestations_failed', {
        error: error.message,
        owner
      });
      throw error;
    }
  }

  /**
   * Revoke an attestation
   */
  async revokeAttestation(attestationUID: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for revoking attestations');
    }

    try {
      const tx = await this.eas.connect(this.signer).revoke({
        schema: this.schemaUID,
        data: { uid: attestationUID }
      });

      const receipt = await tx.wait();

      this.logger.info('attestation_revoked', {
        attestationUID,
        transactionHash: receipt.transactionHash
      });

      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('revoke_attestation_failed', {
        error: error.message,
        attestationUID
      });
      throw error;
    }
  }

  /**
   * Decode attestation data
   */
  private decodeAttestationData(encodedData: string): any {
    const schemaEncoder = new SchemaEncoder(ASSET_SCHEMA.schema);
    return schemaEncoder.decodeData(encodedData);
  }
} 