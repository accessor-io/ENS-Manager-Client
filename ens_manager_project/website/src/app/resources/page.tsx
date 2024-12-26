import Layout from '@/components/Layout';

export default function Resources() {
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-xl font-medium text-gray-900 mb-4">Resources</h1>
        
        <div className="prose">
          <div className="grid grid-cols-1 gap-4">
            <div className="section-card">
              <h2 className="text-sm font-medium text-gray-900 mb-2">ENS Documentation</h2>
              <p className="text-xs text-gray-600 mb-3">
                Official Ethereum Name Service documentation and technical specifications.
              </p>
              <a 
                href="https://docs.ens.domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Visit Documentation
                <span className="ml-1">→</span>
              </a>
            </div>

            <div className="section-card">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Ethereum Networks</h2>
              <p className="text-xs text-gray-600 mb-3">
                Information about different Ethereum networks and how to connect to them.
              </p>
              <a 
                href="https://ethereum.org/en/developers/docs/networks/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Learn More
                <span className="ml-1">→</span>
              </a>
            </div>

            <div className="section-card">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Community</h2>
              <p className="text-xs text-gray-600 mb-3">
                Join the ENS community to discuss features, get help, and contribute.
              </p>
              <div className="space-y-2">
                <a 
                  href="https://discord.gg/ens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center mr-4"
                >
                  Discord Community
                  <span className="ml-1">→</span>
                </a>
                <a 
                  href="https://twitter.com/ensdomains" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                >
                  Twitter Updates
                  <span className="ml-1">→</span>
                </a>
              </div>
            </div>

            <div className="section-card">
              <h2 className="text-sm font-medium text-gray-900 mb-2">GitHub Repository</h2>
              <p className="text-xs text-gray-600 mb-3">
                View the source code, report issues, and contribute to ENS Manager.
              </p>
              <a 
                href="https://github.com/yourusername/ens-manager" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                View Repository
                <span className="ml-1">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 