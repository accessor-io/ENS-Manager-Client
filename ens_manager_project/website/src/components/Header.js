import React from 'react';

function Header() {
  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Ethereum Cross Link Asset Management Service</h1>
      <div className="flex items-center space-x-4">
        <span>$--</span>
        <span>--</span>
        <button className="bg-blue-400 text-gray-900 px-4 py-2 rounded">Connect Wallet</button>
        <button className="text-gray-400">☀</button>
      </div>
    </header>
  );
}

export default Header;