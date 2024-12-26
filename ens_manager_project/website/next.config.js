/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        zlib: false,
        'string_decoder': false,
        'readable-stream': false,
        'async/series': false
      };
    }
    // Optimize file watching
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay before rebuilding
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**'
      ]
    };
    return config;
  },
  // Reduce the number of watched files
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  }
};

module.exports = nextConfig; 