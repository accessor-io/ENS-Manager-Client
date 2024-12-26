import Layout from '@/components/Layout';

export default function Features() {
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-xl font-medium text-gray-900 mb-4">Technical Features</h1>
        
        <div className="prose">
          <section id="account-management" className="mb-12">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Account Management</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Key Management</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">AES-256-GCM encryption for keystore files with Argon2id KDF</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">BIP-39 mnemonic generation and recovery (12/24 words)</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Hardware wallet integration (Ledger, Trezor) via HID API</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Account Operations</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-155 transaction signing with replay protection</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-1559 fee market support with priority fees</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="network-configuration" className="mb-12">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Network Configuration</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Provider Management</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">WebSocket and HTTP providers with automatic failover</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-1193 provider standard compliance</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Network Features</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Multi-chain support: Mainnet, Goerli, Sepolia with EIP-155</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Automatic gas estimation using EIP-1559 and legacy transactions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="ens-resolution" className="mb-12">
            <h2 className="text-sm font-medium text-gray-900 mb-2">ENS Resolution</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Name Resolution</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">ENSIP-10 wildcard resolution support</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Multicall aggregation for efficient batch resolution</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">CCIP-Read support for off-chain resolution</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Record Types</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-634 text record support (email, url, avatar, etc.)</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-2304 multicoin address resolution</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="name-registration" className="mb-12">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Name Registration</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Registration Process</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">ETH Registrar Controller v2.0 implementation</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Commitment-reveal scheme with front-running protection</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Bulk registration support with gas optimization</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Advanced Features</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-1167 minimal proxy contracts for subdomain factories</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">DNS DNSSEC integration for .eth domains</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="record-management" className="mb-12">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Record Management</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Content Management</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-1577 content hash support (IPFS, Swarm, Arweave)</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">IPNS and DNSLink integration</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Advanced Records</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">EIP-2544 ENS wildcard resolution</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-xs text-gray-600">Resolver interface versioning with EIP-165</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
} 