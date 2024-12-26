import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface AccountSettings {
  primaryENS: string | null;
  reverseRecord: boolean;
  autoRenew: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    expiry: boolean;
    bids: boolean;
  };
}

interface ENSName {
  name: string;
  expiryDate: Date;
  isController: boolean;
  isRegistrant: boolean;
  resolver: string;
  linkedAddress: string | null;
}

interface DelegateInfo {
  address: string;
  ensName: string | null;
  votingPower: string;
  delegatedNames: string[];
}

export default function AccountManager({ 
  provider, 
  address,
  onDisconnect 
}: { 
  provider: ethers.providers.Web3Provider;
  address: string;
  onDisconnect: () => void;
}) {
  const [settings, setSettings] = useState<AccountSettings>({
    primaryENS: null,
    reverseRecord: false,
    autoRenew: false,
    notifications: {
      email: false,
      browser: false,
      expiry: true,
      bids: true
    }
  });

  const [ownedNames, setOwnedNames] = useState<ENSName[]>([]);
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'names' | 'delegation' | 'settings'>('names');

  // Fetch account data
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!provider || !address) return;

      try {
        setLoading(true);
        
        // Get ENS names owned by the address
        const ensRegistry = new ethers.Contract(
          '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          ['function owner(bytes32 node) view returns (address)'],
          provider
        );

        // Get primary ENS name
        const primaryENS = await provider.lookupAddress(address);
        
        // Get reverse record status
        const reverseRecordNode = ethers.utils.namehash(address.toLowerCase().substring(2) + '.addr.reverse');
        const hasReverseRecord = await ensRegistry.owner(reverseRecordNode) !== ethers.constants.AddressZero;

        // Update settings
        setSettings(prev => ({
          ...prev,
          primaryENS,
          reverseRecord: hasReverseRecord
        }));

        // Fetch delegate info from ENS DAO
        const ensToken = new ethers.Contract(
          '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
          ['function balanceOf(address) view returns (uint256)', 'function delegates(address) view returns (address)'],
          provider
        );

        const votingPower = await ensToken.balanceOf(address);
        const delegate = await ensToken.delegates(address);
        
        if (delegate !== ethers.constants.AddressZero) {
          const delegateENS = await provider.lookupAddress(delegate);
          setDelegateInfo({
            address: delegate,
            ensName: delegateENS,
            votingPower: ethers.utils.formatEther(votingPower),
            delegatedNames: [] // Would need subgraph query to get full list
          });
        }

      } catch (err) {
        console.error('Error fetching account data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [provider, address]);

  // Update settings
  const updateSettings = async (newSettings: Partial<AccountSettings>) => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      // Here you would typically sync with a backend
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  // Set primary ENS name
  const setPrimaryENS = async (name: string) => {
    if (!provider) return;
    
    try {
      const signer = provider.getSigner();
      const reverseRegistrar = new ethers.Contract(
        '0x084b1c3C81545d370f3634392De611CaaBFf8148',
        ['function setName(string name) public returns (bytes32)'],
        signer
      );

      const tx = await reverseRegistrar.setName(name);
      await tx.wait();

      setSettings(prev => ({ ...prev, primaryENS: name }));
    } catch (err) {
      console.error('Error setting primary ENS:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Account Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {settings.primaryENS || address}
          </p>
        </div>
        <button
          onClick={onDisconnect}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {(['names', 'delegation', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Names Tab */}
          {activeTab === 'names' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">Primary ENS Name</h3>
                  <div className="mt-4 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {settings.primaryENS || 'No primary name set'}
                    </span>
                    <button
                      onClick={() => {
                        const name = prompt('Enter ENS name to set as primary:');
                        if (name) setPrimaryENS(name);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">Owned Names</h3>
                  <div className="mt-4 space-y-4">
                    {ownedNames.length > 0 ? (
                      ownedNames.map(name => (
                        <div key={name.name} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{name.name}</p>
                            <p className="text-xs text-gray-500">
                              Expires: {name.expiryDate.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                              Manage
                            </button>
                            <button className="text-sm text-green-600 hover:text-green-800">
                              Renew
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No ENS names found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delegation Tab */}
          {activeTab === 'delegation' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delegation Settings</h3>
              {delegateInfo ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Delegate</p>
                    <p className="text-sm font-medium text-gray-900">
                      {delegateInfo.ensName || delegateInfo.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Voting Power</p>
                    <p className="text-sm font-medium text-gray-900">
                      {delegateInfo.votingPower} ENS
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Change Delegate
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    You haven't delegated your ENS tokens yet.
                  </p>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Set Up Delegation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.autoRenew}
                      onChange={(e) => updateSettings({ autoRenew: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable auto-renewal for names</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.reverseRecord}
                      onChange={(e) => updateSettings({ reverseRecord: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable reverse record</span>
                  </label>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateSettings({
                          notifications: {
                            ...settings.notifications,
                            [key]: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {key.charAt(0).toUpperCase() + key.slice(1)} notifications
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 