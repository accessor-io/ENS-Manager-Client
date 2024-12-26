"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ENSSearch = ({ onSearchResult }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('ensSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // AI-powered name suggestions
  const generateAISuggestions = async (input) => {
    // Simple algorithm to generate name variations
    const suggestions = [];
    if (input.length > 2) {
      // Add common prefixes
      suggestions.push(`my${input}`);
      suggestions.push(`the${input}`);
      
      // Add common suffixes
      suggestions.push(`${input}dao`);
      suggestions.push(`${input}eth`);
      
      // Add number variations
      if (!input.includes('0')) suggestions.push(`${input}0x`);
      if (!input.includes('3')) suggestions.push(`${input}3`);
      
      // Add compound suggestions
      const words = input.split(/[^a-zA-Z0-9]/);
      if (words.length === 1) {
        suggestions.push(`${input}web3`);
        suggestions.push(`${input}defi`);
      }
    }
    return suggestions.filter(s => s !== input);
  };

  // Smart search with debounce
  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        try {
          // Generate AI suggestions
          const aiNames = await generateAISuggestions(searchTerm);
          setAiSuggestions(aiNames);

          // Check name availability in parallel
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const availabilityChecks = aiNames.map(async (name) => {
            try {
              const address = await provider.resolveName(`${name}.eth`);
              return { name, available: !address };
            } catch {
              return { name, available: true };
            }
          });
          
          const results = await Promise.all(availabilityChecks);
          const availableNames = results
            .filter(r => r.available)
            .map(r => r.name);
          
          setSuggestions(availableNames);
        } catch (error) {
          console.error('Error generating suggestions:', error);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
        setAiSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  const handleSearch = async (term) => {
    if (!term) return;
    
    // Add to search history
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('ensSearchHistory', JSON.stringify(newHistory));
    
    // Perform the search
    if (onSearchResult) {
      onSearchResult(term);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search ENS names..."
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                   text-slate-200 focus:outline-none focus:ring-2 
                   focus:ring-indigo-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-2">AI Suggestions</h3>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion)}
                className="px-3 py-1 text-sm bg-indigo-500/20 hover:bg-indigo-500/30 
                         text-indigo-300 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 
                         text-slate-300 rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Names */}
      {suggestions.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Available Names</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion)}
                className="px-3 py-1 text-sm bg-green-500/20 hover:bg-green-500/30 
                         text-green-300 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ENSSearch;