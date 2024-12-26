import { ethers } from 'ethers';

export interface StandardizedENSRecord {
  name: string;
  address: string;
  resolver: ethers.providers.Resolver | null;
  textRecords?: Record<string, string>;
  contentHash?: string | null;
  timestamp?: string;
}

export const ProjectStandards = {
  ens: {
    registryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    textRecordKeys: [
      'avatar',
      'com.github',
      'com.twitter',
      'org.telegram',
      'url',
      'email',
      'description'
    ],
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'
  },
  cache: {
    shortTerm: 5 * 60 * 1000, // 5 minutes
    mediumTerm: 30 * 60 * 1000, // 30 minutes
    longTerm: 24 * 60 * 60 * 1000 // 24 hours
  }
};

export class StandardsEnforcer {
  static validateENSName(name: string): boolean {
    return name.endsWith('.eth') || name.includes('.');
  }

  static formatError(code: string, message: string) {
    return new Error(`[${code}] ${message}`);
  }

  async standardizeRecord(data: {
    name: string;
    address: string;
    resolver: ethers.providers.Resolver | null;
  }): Promise<StandardizedENSRecord> {
    return {
      ...data,
      timestamp: new Date().toISOString()
    };
  }
} 