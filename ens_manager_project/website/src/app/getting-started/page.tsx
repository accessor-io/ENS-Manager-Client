import Layout from '@/components/Layout';

export default function GettingStarted() {
  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Getting Started with ENS Manager</h1>

        <div className="prose">
          <section id="installation" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Installation</h2>
            <p className="text-gray-600">
              Follow these steps to install ENS Manager on your system:
            </p>

            <div className="mt-6 space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-medium text-gray-900 mb-3">1. Clone the repository</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>git clone https://github.com/yourusername/ens-manager.git
</code>
                </pre>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-medium text-gray-900 mb-3">2. Install dependencies</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>poetry install</code>
                </pre>
              </div>
            </div>
          </section>

          <section id="quick-start" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Start</h2>
            <p className="text-gray-600 mb-6">
              After installation, you can start using ENS Manager in interactive mode:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <code>poetry run ens-manager</code>
              </pre>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Operations</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Create or load Ethereum accounts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Configure network providers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Resolve ENS names</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Register new domains</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Manage existing domains</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="prerequisites" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Python 3.8 or higher</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Poetry package manager</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Access to an Ethereum node (e.g., Infura, Alchemy)</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
} 