"use client";

import React, { useState } from "react";
import WalletConnector from "./WalletConnector";
import NetworkStatus from "./NetworkStatus";
import ENSSearch from "./ENSSearch";
import ENSActivity from "./ENSActivity";
import ENSTextRecords from "./ENSTextRecords";

const Dashboard = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedENSName, setSelectedENSName] = useState(null);

  const handleSearchResult = (result) => {
    if (result) {
      setSelectedAddress(result.address);
      setSelectedENSName(result.name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-12">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 border-r border-slate-800/50 shadow-lg backdrop-blur-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
            ENS Command
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Domain Management System
          </p>
        </div>
        
        {/* System Status in Sidebar */}
        <div className="px-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">System Status</h2>
            <NetworkStatus />
          </div>
        </div>

        {/* Wallet Connection in Sidebar */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800/50">
          <WalletConnector />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-64">
        <main className="max-w-6xl mx-auto px-8 py-8">
          {/* Command Terminal - Top Section */}
          <div className="mb-8">
            <div className="bg-slate-900/90 rounded-xl border border-slate-800/50 shadow-lg backdrop-blur-sm">
              <div className="p-5 border-b border-slate-800/50">
                <h2 className="text-base font-semibold text-slate-200">ENS Command Terminal</h2>
              </div>
              <div className="p-5">
                <ENSSearch onSearchResult={handleSearchResult} />
              </div>
            </div>
          </div>

          {/* Two Column Layout for Activity and Records */}
          <div className="grid grid-cols-12 gap-8">
            {/* Domain Activity - Left Column */}
            <div className="col-span-5">
              <div className="bg-slate-900/90 rounded-xl border border-slate-800/50 shadow-lg backdrop-blur-sm h-full">
                <div className="p-5 border-b border-slate-800/50">
                  <h2 className="text-base font-semibold text-slate-200">Domain Activity</h2>
                </div>
                <div className="p-5">
                  <ENSActivity connectedAddress={selectedAddress} />
                </div>
              </div>
            </div>

            {/* Text Records - Right Column */}
            <div className="col-span-7">
              <div className="bg-slate-900/90 rounded-xl border border-slate-800/50 shadow-lg backdrop-blur-sm h-full">
                <div className="p-5 border-b border-slate-800/50">
                  <h2 className="text-base font-semibold text-slate-200">ENS Text Records</h2>
                </div>
                <div className="p-5">
                  <ENSTextRecords ensName={selectedENSName} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
