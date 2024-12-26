import { ethers } from 'ethers';
import { ProjectStandards, StandardsEnforcer, StandardizedENSRecord } from '@/config/standards';
import logger from './logger';

export class ENSUtility {
  private readonly provider: ethers.providers.Provider;
  private readonly standards: StandardsEnforcer;

  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
    this.standards = new StandardsEnforcer();
    logger.info('ENS Utility initialized', { provider: provider.connection.url });
  }

  async resolveENS(name: string): Promise<StandardizedENSRecord | null> {
    try {
      const address = await this.provider.resolveName(name);
      if (!address) {
        logger.warn('ENS name not resolved', { name });
        return null;
      }

      const record = await this.standards.standardizeRecord({
        name,
        address,
        resolver: await this.provider.getResolver(name)
      });

      logger.info('ENS name resolved', { name, address });
      return record;
    } catch (error) {
      logger.error('Error resolving ENS name', { name, error: error.message });
      return null;
    }
  }

  async lookupAddress(address: string): Promise<string | null> {
    try {
      const name = await this.provider.lookupAddress(address);
      logger.info('Address lookup completed', { address, name });
      return name;
    } catch (error) {
      logger.error('Error looking up address', { address, error: error.message });
      return null;
    }
  }
} 