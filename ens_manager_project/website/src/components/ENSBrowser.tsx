"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Add at the top of the file
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Enhanced ABI with more functionality
const ENS_RESOLVER_ABI = [
  'function addr(bytes32 node) public view returns (address)',
  'function name(bytes32 node) public view returns (string)',
  'function getText(bytes32 node, string key) public view returns (string)',
  'function contenthash(bytes32 node) public view returns (bytes)',
  'function multicall(bytes[] calldata data) public view returns (bytes[] memory)',
  'event AddrChanged(bytes32 indexed node, address a)',
  'event ContenthashChanged(bytes32 indexed node, bytes hash)',
  'event TextChanged(bytes32 indexed node, string indexed indexedKey, string key)',
  'function supportsInterface(bytes4 interfaceID) public view returns (bool)'
];

// Enhanced interface for batch processing
interface BatchResolution {
  name: string;
  status: 'pending' | 'success' | 'error';
  result?: ENSProfile;
  error?: string;
}

interface ENSProfile {
  name: string;
  address: string | null;
  avatar: string | null;
  contentHash: string | null;
  textRecords: {
    email?: string;
    url?: string;
    description?: string;
    twitter?: string;
    github?: string;
    discord?: string;
    telegram?: string;
    [key: string]: string | undefined;
  };
  subdomains: string[];
  resolver: string | null;
  owner: string | null;
  expiryDate: Date | null;
  lastUpdated: Date | null;
  platformActivity?: ActivityScan;
}

interface ENSActivity {
  type: 'Registration' | 'Transfer' | 'Update' | 'Renewal';
  timestamp: Date;
  from: string;
  to: string;
  transactionHash: string;
  gasUsed: string;
  blockNumber: number;
}

// Add platform activity interfaces
interface PlatformActivity {
  platform: string;
  type: string;
  data: any;
  lastActive: Date;
  profileUrl?: string;
}

interface ActivityScan {
  address: string;
  platforms: {
    [key: string]: PlatformActivity;
  };
}

// Add platform configurations
const PLATFORMS = {
  LENS: {
    api: 'https://api.lens.dev',
    query: `
      query Profile($address: EthereumAddress!) {
        profiles(request: { ownedBy: [$address] }) {
          items {
            id
            handle
            stats {
              totalFollowers
              totalFollowing
              totalPosts
            }
          }
        }
      }
    `
  },
  SNAPSHOT: {
    api: 'https://hub.snapshot.org/graphql',
    query: `
      query Votes($address: String!) {
        votes(where: { voter: $address }) {
          id
          proposal {
            title
          }
          created
        }
      }
    `
  },
  FOUNDATION: {
    api: 'https://api.foundation.app/graphql',
    query: `
      query Profile($address: String!) {
        user(address: $address) {
          username
          profileImageUrl
          createdAt
          collectors {
            totalCount
          }
        }
      }
    `
  },
  OPENSEA: {
    api: 'https://api.opensea.io/api/v1',
    endpoint: (address: string) => `/user/${address}`
  },
  RARIBLE: {
    api: 'https://api.rarible.org/v0.1',
    endpoint: (address: string) => `/profiles/${address}`
  },
  MIRROR: {
    api: 'https://mirror-api.com/graphql',
    query: `
      query Articles($address: String!) {
        articles(where: { author: $address }) {
          id
          title
          timestamp
        }
      }
    `
  },
  GITCOIN: {
    api: 'https://gitcoin.co/api/v0.1',
    endpoint: (address: string) => `/grants/contributor/${address}`
  },
  POAP: {
    api: 'https://api.poap.xyz',
    endpoint: (address: string) => `/actions/scan/${address}`
  },
  DECENTRALAND: {
    api: 'https://api.decentraland.org/v1',
    endpoint: (address: string) => `/addresses/${address}/assets`
  },
  ENS_DAO: {
    api: 'https://api.thegraph.com/subgraphs/name/ensdomains/governance',
    query: `
      query DaoActivity($address: String!) {
        delegates(where: { id: $address }) {
          id
          delegatedVotes
          tokenBalance
          votes {
            id
            proposal {
              id
              title
              status
            }
            choice
            timestamp
          }
          proposals {
            id
            title
            status
            createdAt
          }
        }
      }
    `
  },
  AAVE_DAO: {
    api: 'https://api.thegraph.com/subgraphs/name/aave/governance-v2',
    query: `
      query AaveGovernance($address: String!) {
        votes(where: { voter: $address }) {
          id
          proposal {
            id
            title
            state
          }
          support
          timestamp
        }
      }
    `
  },
  UNISWAP_DAO: {
    api: 'https://api.thegraph.com/subgraphs/name/uniswap/governance',
    query: `
      query UniswapGovernance($address: String!) {
        votes(where: { voter: $address }) {
          id
          proposal {
            id
            title
            status
          }
          support
          timestamp
        }
      }
    `
  },
  COMPOUND_DAO: {
    api: 'https://api.thegraph.com/subgraphs/name/compound-finance/governance',
    query: `
      query CompoundGovernance($address: String!) {
        votes(where: { voter: $address }) {
          id
          proposal {
            id
            description
            state
          }
          support
          timestamp
        }
      }
    `
  },
  DYDX_DAO: {
    api: 'https://api.thegraph.com/subgraphs/name/dydxprotocol/dydx-governance',
    query: `
      query DydxGovernance($address: String!) {
        votes(where: { voter: $address }) {
          id
          proposal {
            id
            title
            status
          }
          support
          timestamp
        }
      }
    `
  }
};

// Add activity scanning function
async function scanPlatformActivity(address: string): Promise<ActivityScan> {
  const activities: ActivityScan = {
    address,
    platforms: {}
  };

  const scanPromises = Object.entries(PLATFORMS).map(async ([platform, config]) => {
    try {
      let data;
      if ('query' in config) {
        // GraphQL endpoints
        const response = await fetch(config.api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: config.query,
            variables: { address }
          })
        });
        data = await response.json();
      } else if ('endpoint' in config) {
        // REST endpoints
        const response = await fetch(`${config.api}${config.endpoint(address)}`);
        data = await response.json();
      }

      if (data) {
        activities.platforms[platform] = {
          platform,
          type: 'profile',
          data,
          lastActive: new Date(),
          profileUrl: getPlatformProfileUrl(platform, address, data)
        };
      }
    } catch (error) {
      console.error(`Error scanning ${platform}:`, error);
    }
  });

  await Promise.allSettled(scanPromises);
  return activities;
}

// Helper function to get platform-specific profile URLs
function getPlatformProfileUrl(platform: string, address: string, data: any): string {
  switch (platform) {
    case 'LENS':
      return `https://lenster.xyz/u/${data?.profiles?.items[0]?.handle}`;
    case 'SNAPSHOT':
      return `https://snapshot.org/#/${address}`;
    case 'FOUNDATION':
      return `https://foundation.app/@${data?.user?.username}`;
    case 'OPENSEA':
      return `https://opensea.io/${address}`;
    case 'RARIBLE':
      return `https://rarible.com/user/${address}`;
    case 'MIRROR':
      return `https://mirror.xyz/${address}`;
    case 'GITCOIN':
      return `https://gitcoin.co/profile/${address}`;
    case 'POAP':
      return `https://app.poap.xyz/scan/${address}`;
    case 'DECENTRALAND':
      return `https://play.decentraland.org/profile/${address}`;
    case 'ENS_DAO':
      return `https://dao.ens.domains/delegate/${address}`;
    case 'AAVE_DAO':
      return `https://app.aave.com/governance/delegation/${address}`;
    case 'UNISWAP_DAO':
      return `https://app.uniswap.org/#/vote/${address}`;
    case 'COMPOUND_DAO':
      return `https://compound.finance/governance/address/${address}`;
    case 'DYDX_DAO':
      return `https://dydx.community/profile/${address}`;
    default:
      return '';
  }
}

// Add activity display component
function PlatformActivityDisplay({ activities }: { activities: ActivityScan }) {
  const daoActivities = Object.entries(activities.platforms).filter(([platform]) => 
    ['ENS_DAO', 'AAVE_DAO', 'UNISWAP_DAO', 'COMPOUND_DAO', 'DYDX_DAO'].includes(platform)
  );
  
  const otherActivities = Object.entries(activities.platforms).filter(([platform]) => 
    !['ENS_DAO', 'AAVE_DAO', 'UNISWAP_DAO', 'COMPOUND_DAO', 'DYDX_DAO'].includes(platform)
  );

  return (
    <div className="space-y-8">
      {daoActivities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">DAO Governance Activity</h3>
            <div className="text-sm text-gray-500">
              Tracking {daoActivities.length} DAOs
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {daoActivities.map(([platform, activity]) => (
              <div key={platform} className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{platform.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">Last active: {new Date(activity.lastActive).toLocaleDateString()}</p>
                  </div>
                  {activity.profileUrl && (
                    <a
                      href={activity.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      View Profile
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {renderPlatformData(platform, activity.data)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherActivities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Web3 Platform Activity</h3>
            <div className="text-sm text-gray-500">
              Active on {otherActivities.length} platforms
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {otherActivities.map(([platform, activity]) => (
              <div key={platform} className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{platform}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">Last active: {new Date(activity.lastActive).toLocaleDateString()}</p>
                  </div>
                  {activity.profileUrl && (
                    <a
                      href={activity.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      View Profile
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {renderPlatformData(platform, activity.data)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {daoActivities.length === 0 && otherActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Platform Activity Found</h3>
          <p className="text-gray-500">This address hasn't shown activity on any integrated platforms yet.</p>
        </div>
      )}
    </div>
  );
}

// Helper function to render platform-specific data
function renderPlatformData(platform: string, data: any) {
  switch (platform) {
    case 'LENS':
      return data?.profiles?.items[0]?.stats ? (
        <div className="space-y-1">
          <div>Followers: {data.profiles.items[0].stats.totalFollowers}</div>
          <div>Following: {data.profiles.items[0].stats.totalFollowing}</div>
          <div>Posts: {data.profiles.items[0].stats.totalPosts}</div>
        </div>
      ) : 'No profile found';
    
    case 'SNAPSHOT':
      return data?.votes?.length ? (
        <div>Total Votes: {data.votes.length}</div>
      ) : 'No voting history';
    
    case 'ENS_DAO':
      if (!data?.delegates?.[0]) return 'No DAO activity';
      const delegate = data.delegates[0];
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Voting Power</div>
              <div className="text-lg font-semibold text-gray-900">
                {(Number(delegate.tokenBalance) / 1e18).toFixed(2)} ENS
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Delegated Votes</div>
              <div className="text-lg font-semibold text-gray-900">
                {Number(delegate.delegatedVotes).toLocaleString()}
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Votes</h5>
            <div className="space-y-2">
              {delegate.votes.slice(0, 3).map((vote: any) => (
                <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      vote.choice === 1 ? 'bg-green-100 text-green-800' :
                      vote.choice === 0 ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vote.choice === 1 ? 'For' : vote.choice === 0 ? 'Against' : 'Abstain'}
                    </span>
                    <span className="text-sm text-gray-600">
                      Proposal #{vote.proposal.id}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(parseInt(vote.timestamp) * 1000).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {delegate.proposals.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Created Proposals</h5>
              <div className="space-y-2">
                {delegate.proposals.slice(0, 2).map((proposal: any) => (
                  <div key={proposal.id} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        #{proposal.id}: {proposal.title}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        proposal.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'AAVE_DAO':
      if (!data?.votes?.length) return 'No DAO activity';
      return (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Governance Votes</div>
            <div className="text-lg font-semibold text-gray-900">{data.votes.length}</div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Activity</h5>
            <div className="space-y-2">
              {data.votes.slice(0, 3).map((vote: any) => (
                <div key={vote.id} className="p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {vote.proposal.title || `Proposal #${vote.proposal.id}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(parseInt(vote.timestamp) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      vote.support ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vote.support ? 'Supported' : 'Opposed'}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      State: {vote.proposal.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'UNISWAP_DAO':
      if (!data?.votes?.length) return 'No DAO activity';
      return (
        <div className="space-y-2">
          <div>Governance Participation: {data.votes.length} votes</div>
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Latest Votes</div>
            {data.votes.slice(0, 3).map((vote: any) => (
              <div key={vote.id} className="text-xs flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  vote.support ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {vote.proposal.title || `Proposal #${vote.proposal.id}`}
              </div>
            ))}
          </div>
        </div>
      );

    case 'COMPOUND_DAO':
      if (!data?.votes?.length) return 'No DAO activity';
      return (
        <div className="space-y-2">
          <div>Total Proposals Voted: {data.votes.length}</div>
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Recent Governance</div>
            {data.votes.slice(0, 3).map((vote: any) => (
              <div key={vote.id} className="text-xs">
                <span className={vote.support ? 'text-green-600' : 'text-red-600'}>
                  {vote.support ? '✓' : '✗'}
                </span>
                {' '}
                {vote.proposal.description?.slice(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      );

    case 'DYDX_DAO':
      if (!data?.votes?.length) return 'No DAO activity';
      return (
        <div className="space-y-2">
          <div>Governance Votes: {data.votes.length}</div>
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Vote History</div>
            {data.votes.slice(0, 3).map((vote: any) => (
              <div key={vote.id} className="text-xs">
                {new Date(parseInt(vote.timestamp) * 1000).toLocaleDateString()}: {' '}
                {vote.proposal.title || `Proposal #${vote.proposal.id}`}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return 'Activity data available';
  }
}

const TEXT_RECORDS = [
  'email',
  'url',
  'avatar',
  'description',
  'notice',
  'keywords',
  'com.github',
  'com.twitter',
  'com.discord',
  'org.telegram',
  'eth.ens.delegate',
  'com.reddit',
  'org.matrix'
];

// Add batch processing functionality
const processBatch = async (
  names: string[],
  provider: ethers.providers.JsonRpcProvider
): Promise<BatchResolution[]> => {
  const results: BatchResolution[] = [];
  const batchSize = 5; // Process 5 names at a time
  
  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);
    const promises = batch.map(async (name) => {
      try {
        const resolver = await provider.getResolver(name);
        if (!resolver) {
          return {
            name,
            status: 'error' as const,
            error: 'ENS name not found or not configured'
          };
        }

        // Use multicall for efficient batch resolution
        const resolverContract = new ethers.Contract(
          resolver.address,
          ENS_RESOLVER_ABI,
          provider
        );

        const nameHash = ethers.utils.namehash(name);
        const calls = [
          resolverContract.interface.encodeFunctionData('addr', [nameHash]),
          resolverContract.interface.encodeFunctionData('contenthash', [nameHash])
        ];

        const [address, contentHash] = await Promise.all([
          resolver.getAddress(),
          resolver.getContentHash().catch(() => null)
        ]);

        // Fetch text records efficiently
        const textRecordPromises = TEXT_RECORDS.map(record =>
          resolver.getText(record).catch(() => null)
        );
        const textValues = await Promise.all(textRecordPromises);
        const textRecords: { [key: string]: string } = {};
        TEXT_RECORDS.forEach((record, index) => {
          if (textValues[index]) textRecords[record] = textValues[index];
        });

        return {
          name,
          status: 'success' as const,
          result: {
            name,
            address,
            avatar: textRecords.avatar || null,
            contentHash,
            textRecords,
            subdomains: [],
            resolver: resolver.address,
            owner: await provider.lookupAddress(address),
            expiryDate: null,
            lastUpdated: new Date()
          }
        };
      } catch (error) {
        return {
          name,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Resolution failed'
        };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
};

// Add wallet connection state
interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  ensName: string | null;
}

// Update the Event interface
interface ENSEvent extends Omit<ethers.Event, 'args'> {
  args: Array<any>;
  gasLimit: ethers.BigNumber;
}

// Update the filters interface
interface FilterState {
  [key: string]: boolean;
  hasAddress: boolean;
  hasAvatar: boolean;
  hasContentHash: boolean;
  hasSocialLinks: boolean;
}

export default function ENSBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [ensProfile, setEnsProfile] = useState<ENSProfile | null>(null);
  const [activities, setActivities] = useState<ENSActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'records' | 'platforms'>('profile');
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [isValidENS, setIsValidENS] = useState(true);
  const [batchInput, setBatchInput] = useState<string>('');
  const [batchResults, setBatchResults] = useState<BatchResolution[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    hasAddress: false,
    hasAvatar: false,
    hasContentHash: false,
    hasSocialLinks: false
  });
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    ensName: null
  });

  // Enhanced initialization
  useEffect(() => {
    const initProvider = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          'https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc'
        );
        await provider.getNetwork();
        setProvider(provider);
      } catch (err) {
        setError('Failed to connect to Ethereum network. Please check your connection.');
      }
    };
    initProvider();
  }, []);

  // Enhanced batch processing
  const handleBatchResolution = useCallback(async () => {
    if (!provider || !batchInput.trim()) return;

    const names = batchInput
      .split('\n')
      .map(name => name.trim().toLowerCase())
      .filter(name => name && validateENSName(name));

    if (names.length === 0) {
      setError('No valid ENS names found in input');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await processBatch(names, provider);
      setBatchResults(results);
    } catch (err) {
      setError('Batch processing failed. Please try again.');
      console.error('Batch processing error:', err);
    } finally {
      setLoading(false);
    }
  }, [provider, batchInput]);

  // Add filter functionality
  const filterResults = useCallback((results: BatchResolution[]) => {
    return results.filter(result => {
      if (result.status !== 'success') return false;
      const profile = result.result!;
      
      if (filters.hasAddress && !profile.address) return false;
      if (filters.hasAvatar && !profile.avatar) return false;
      if (filters.hasContentHash && !profile.contentHash) return false;
      if (filters.hasSocialLinks && Object.keys(profile.textRecords).length === 0) return false;
      
      return true;
    });
  }, [filters]);

  // Validate ENS name format
  const validateENSName = (name: string): boolean => {
    const ensRegex = /^([a-z0-9-]+\.)*[a-z0-9-]+\.eth$/;
    return ensRegex.test(name);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setIsValidENS(value === '' || validateENSName(value));
  };

  const fetchENSData = async (name: string) => {
    if (!provider) {
      setError('Provider not initialized');
      return;
    }

    if (!validateENSName(name)) {
      setError('Invalid ENS name format. Must end with .eth');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get resolver and check if ENS exists
      const resolver = await provider.getResolver(name);
      if (!resolver) {
        throw new Error('ENS name not found or not configured');
      }

      // Create resolver contract instance with full ABI
      const resolverContract = new ethers.Contract(
        resolver.address,
        ENS_RESOLVER_ABI,
        provider
      );

      // Fetch basic info
      const address = await resolver.getAddress();
      const contentHash = await resolver.getContentHash().catch(() => null);
      const owner = await provider.lookupAddress(address);

      // Fetch all text records in parallel
      const textRecordPromises = TEXT_RECORDS.map(async (record) => {
        try {
          const value = await resolver.getText(record);
          return { record, value };
        } catch {
          return { record, value: null };
        }
      });

      const textRecordResults = await Promise.all(textRecordPromises);
      const textRecords: { [key: string]: string } = {};
      textRecordResults.forEach(({ record, value }) => {
        if (value) textRecords[record] = value;
      });

      // Fetch registration info
      const registrar = new ethers.Contract(
        '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5', // ENS ETH Registrar
        ['function nameExpires(uint256 id) external view returns(uint)'],
        provider
      );

      const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name.replace('.eth', '')));
      const expiryDate = await registrar.nameExpires(labelHash)
        .then((timestamp: number) => new Date(timestamp * 1000))
        .catch(() => null);

      // Calculate namehash for event filtering
      const nameHash = ethers.utils.namehash(name);

      // Fetch recent events
      const addrChangedFilter = resolverContract.filters.AddrChanged(nameHash);
      const contentChangedFilter = resolverContract.filters.ContenthashChanged(nameHash);
      const textChangedFilter = resolverContract.filters.TextChanged(nameHash);

      // Get the last 1000 blocks for event search
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = currentBlock - 1000;

      // Fetch events in parallel
      const [addrEvents, contentEvents, textEvents] = await Promise.all([
        resolverContract.queryFilter(addrChangedFilter, fromBlock),
        resolverContract.queryFilter(contentChangedFilter, fromBlock),
        resolverContract.queryFilter(textChangedFilter, fromBlock)
      ]);

      // Combine and sort all events
      const allEvents = [...addrEvents, ...contentEvents, ...textEvents]
        .map(event => event as unknown as ENSEvent)
        .sort((a, b) => b.blockNumber - a.blockNumber);

      // Convert events to activities
      const recentActivities: ENSActivity[] = await Promise.all(
        allEvents.slice(0, 10).map(async (event) => {
          const block = await event.getBlock();
          const type = event.event === 'AddrChanged' ? 'Update' :
                      event.event === 'ContenthashChanged' ? 'Update' :
                      'Update';
          
          return {
            type,
            timestamp: new Date(block.timestamp * 1000),
            from: event.args[0] || '0x0',
            to: event.args[1] || address,
            transactionHash: event.transactionHash,
            gasUsed: event.gasLimit.toString(),
            blockNumber: event.blockNumber
          };
        })
      );

      setEnsProfile({
        name,
        address,
        avatar: textRecords.avatar || null,
        contentHash,
        textRecords,
        subdomains: [], // Would need separate call to fetch subdomains
        resolver: resolver.address,
        owner,
        expiryDate,
        lastUpdated: new Date()
      });
      setActivities(recentActivities);

      if (address) {
        const platformActivity = await scanPlatformActivity(address);
        setEnsProfile(prev => prev ? { ...prev, platformActivity } : null);
      }
    } catch (err) {
      console.error('Error fetching ENS data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ENS data');
    } finally {
      setLoading(false);
    }
  };

  // Add wallet connection functions
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet to connect.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      // Try to resolve ENS name for the connected address
      let ensName = null;
      try {
        ensName = await provider.lookupAddress(address);
      } catch (err) {
        console.warn('ENS reverse lookup failed:', err);
      }

      setWalletState({
        address,
        chainId: network.chainId,
        isConnected: true,
        ensName
      });

      // Update the provider to use the Web3 provider
      setProvider(provider);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      address: null,
      chainId: null,
      isConnected: false,
      ensName: null
    });
    
    // Reset to Infura provider
    const infuraProvider = new ethers.providers.JsonRpcProvider(
      'https://mainnet.infura.io/v3/9e88fbe7e3cf4adba63f545158e31cfc'
    );
    setProvider(infuraProvider);
  };

  // Add wallet event listeners
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        connectWallet();
      });

      window.ethereum.on('disconnect', () => {
        disconnectWallet();
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', connectWallet);
        window.ethereum.removeListener('chainChanged', connectWallet);
        window.ethereum.removeListener('disconnect', disconnectWallet);
      };
    }
  }, []);

  return (
    <div className="w-full">
      {/* Add Wallet Connection UI */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1">
          {/* Existing search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search ENS name (e.g., vitalik.eth)"
              className={`w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                isValidENS 
                  ? 'border-gray-200 focus:ring-blue-500' 
                  : 'border-red-300 focus:ring-red-500'
              }`}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && fetchENSData(searchQuery)}
            />
            <button
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 text-xs text-white rounded-md transition-colors ${
                isValidENS && searchQuery
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={() => isValidENS && searchQuery && fetchENSData(searchQuery)}
              disabled={!isValidENS || !searchQuery}
            >
              Search
            </button>
          </div>
        </div>
        
        <div className="ml-4">
          {walletState.isConnected ? (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="text-gray-500">Connected as</p>
                <p className="font-medium text-gray-900">
                  {walletState.ensName || `${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`}
                </p>
              </div>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Network Warning */}
      {walletState.isConnected && walletState.chainId !== 1 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-yellow-700">
              Please switch to Ethereum Mainnet to use all features.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          {(['profile', 'activity', 'records', 'platforms'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {ensProfile && !loading && (
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name</span>
                    <span className="text-xs font-medium">{ensProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Address</span>
                    <a 
                      href={`https://etherscan.io/address/${ensProfile.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-600 hover:text-blue-800"
                    >
                      {ensProfile.address?.slice(0, 8)}...{ensProfile.address?.slice(-6)}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Owner</span>
                    <span className="text-xs font-mono">{ensProfile.owner || 'N/A'}</span>
                  </div>
                  {ensProfile.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Expires</span>
                      <span className="text-xs">
                        {ensProfile.expiryDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Profiles */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Web3 Social Profiles</h3>
                <div className="space-y-2">
                  {Object.entries(ensProfile.textRecords).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{key}</span>
                        <a
                          href={value.startsWith('http') ? value : `https://${value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-[200px]"
                        >
                          {value}
                        </a>
                      </div>
                    )
                  ))}
                  {Object.keys(ensProfile.textRecords).length === 0 && (
                    <p className="text-xs text-gray-500">No social profiles found</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Block</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">From</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">To</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activities.length > 0 ? (
                      activities.map((activity, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs text-gray-900">{activity.type}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {activity.timestamp.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {activity.blockNumber}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-500">
                            {activity.from.slice(0, 6)}...{activity.from.slice(-4)}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-500">
                            {activity.to.slice(0, 6)}...{activity.to.slice(-4)}
                          </td>
                          <td className="px-4 py-2">
                            <a
                              href={`https://etherscan.io/tx/${activity.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-600 hover:text-blue-800"
                            >
                              {activity.transactionHash.slice(0, 6)}...{activity.transactionHash.slice(-4)}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                          No recent activity found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Content Records */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Content Records</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Content Hash</span>
                    {ensProfile.contentHash ? (
                      <a
                        href={ensProfile.contentHash.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-blue-600 hover:text-blue-800 truncate max-w-[200px]"
                      >
                        {ensProfile.contentHash}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">Not set</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Resolver</span>
                    <a
                      href={`https://etherscan.io/address/${ensProfile.resolver}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-600 hover:text-blue-800"
                    >
                      {ensProfile.resolver?.slice(0, 8)}...{ensProfile.resolver?.slice(-6)}
                    </a>
                  </div>
                </div>
              </div>

              {/* Text Records */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Text Records</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {Object.entries(ensProfile.textRecords).length > 0 ? (
                    Object.entries(ensProfile.textRecords).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-xs text-gray-500">{key}</span>
                        <span className="text-xs text-right break-all max-w-[200px]">{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No text records found</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'platforms' && ensProfile?.platformActivity && (
            <PlatformActivityDisplay activities={ensProfile.platformActivity} />
          )}
        </div>
      )}

      {/* Add batch processing UI */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Batch Resolution</h3>
        <textarea
          className="w-full h-32 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 border-gray-200 focus:ring-blue-500"
          placeholder="Enter ENS names (one per line)"
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
        />
        <button
          className="mt-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          onClick={handleBatchResolution}
          disabled={loading || !batchInput.trim()}
        >
          {loading ? 'Processing...' : 'Resolve Batch'}
        </button>
      </div>

      {/* Add filter controls */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(filters).map(([key, value]) => (
          <label key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={() => setFilters(prev => ({ ...prev, [key]: !prev[key] }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </label>
        ))}
      </div>

      {/* Display batch results */}
      {batchResults.length > 0 && (
        <div className="mt-6 space-y-4">
          {filterResults(batchResults).map((result) => (
            <div
              key={result.name}
              className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <h4 className="text-sm font-medium text-gray-900 mb-2">{result.name}</h4>
              {result.status === 'success' ? (
                <pre className="text-xs overflow-x-auto p-2 bg-white rounded">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-red-600">{result.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 