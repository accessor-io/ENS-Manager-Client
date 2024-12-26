"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ENSTextRecords = ({ ensName }) => {
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [validationResults, setValidationResults] = useState({});
  const [profileScore, setProfileScore] = useState(0);

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

  // AI-powered record validation
  const validateRecord = (key, value) => {
    const validation = { isValid: true, message: '' };

    switch (key) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        validation.isValid = emailRegex.test(value);
        validation.message = validation.isValid ? 'Valid email format' : 'Invalid email format';
        break;

      case 'url':
        try {
          new URL(value);
          validation.isValid = true;
          validation.message = 'Valid URL format';
        } catch {
          validation.isValid = false;
          validation.message = 'Invalid URL format';
        }
        break;

      case 'avatar':
        const validImageFormats = ['ipfs://', 'https://', 'data:image/'];
        validation.isValid = validImageFormats.some(format => value.startsWith(format));
        validation.message = validation.isValid ? 'Valid avatar format' : 'Invalid avatar format. Use IPFS or HTTPS URL';
        break;

      case 'com.github':
        validation.isValid = /^[a-zA-Z0-9-]+$/.test(value);
        validation.message = validation.isValid ? 'Valid GitHub username' : 'Invalid GitHub username format';
        break;

      case 'com.twitter':
        validation.isValid = /^[a-zA-Z0-9_]{1,15}$/.test(value);
        validation.message = validation.isValid ? 'Valid Twitter handle' : 'Invalid Twitter handle format';
        break;

      default:
        validation.message = 'Field populated';
    }

    return validation;
  };

  // AI-powered suggestions generator
  const generateSuggestions = (records) => {
    const newSuggestions = {};

    // Suggest GitHub profile if Twitter is present but GitHub isn't
    if (records['com.twitter'] && !records['com.github']) {
      newSuggestions['com.github'] = 'Consider adding your GitHub profile to showcase your development work';
    }

    // Suggest avatar if missing
    if (!records.avatar) {
      newSuggestions.avatar = 'Add an avatar to make your ENS profile more recognizable';
    }

    // Suggest description if missing
    if (!records.description) {
      newSuggestions.description = 'Add a description to help others understand who you are';
    }

    // Suggest delegate if active in ENS governance
    if (!records['eth.ens.delegate']) {
      newSuggestions['eth.ens.delegate'] = 'Consider delegating your ENS voting power';
    }

    // Cross-platform suggestions
    if (records['com.twitter'] && !records['com.discord']) {
      newSuggestions['com.discord'] = 'Add your Discord to connect with your Twitter community';
    }

    return newSuggestions;
  };

  // Calculate profile completeness score
  const calculateProfileScore = (records) => {
    const weights = {
      avatar: 15,
      description: 15,
      email: 10,
      url: 10,
      'com.twitter': 10,
      'com.github': 10,
      'com.discord': 5,
      'org.telegram': 5,
      keywords: 5,
      notice: 5,
      'eth.ens.delegate': 5,
      'com.reddit': 2.5,
      'org.matrix': 2.5
    };

    let score = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      totalWeight += weight;
      if (records[key]) {
        score += weight;
      }
    });

    return Math.round((score / totalWeight) * 100);
  };

  useEffect(() => {
    const fetchRecords = async () => {
      if (!ensName) return;

      setLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const resolver = await provider.getResolver(ensName);
        
        if (resolver) {
          const recordPromises = TEXT_RECORDS.map(async (key) => {
            const value = await resolver.getText(key);
            return [key, value];
          });

          const recordEntries = await Promise.all(recordPromises);
          const newRecords = Object.fromEntries(
            recordEntries.filter(([_, value]) => value)
          );

          setRecords(newRecords);
          
          // Generate validations
          const validations = {};
          Object.entries(newRecords).forEach(([key, value]) => {
            validations[key] = validateRecord(key, value);
          });
          setValidationResults(validations);

          // Generate suggestions
          setSuggestions(generateSuggestions(newRecords));

          // Calculate profile score
          setProfileScore(calculateProfileScore(newRecords));
        }
      } catch (error) {
        console.error('Error fetching ENS text records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [ensName]);

  return (
    <div className="space-y-6">
      {/* Profile Score */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Profile Completeness</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-slate-200">{profileScore}%</div>
            <div className="text-sm text-slate-400">complete</div>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${profileScore}%` }}
          />
        </div>
      </div>

      {/* Text Records */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-200">Text Records</h3>
          {!loading && (
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 text-sm bg-indigo-500/20 hover:bg-indigo-500/30 
                       text-indigo-300 rounded-lg transition-colors"
            >
              {editing ? 'Save Changes' : 'Edit Records'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {TEXT_RECORDS.map(key => {
              const value = records[key] || '';
              const suggestion = suggestions[key];
              const validation = validationResults[key];

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      {key.replace(/^com\.|^org\.|^eth\.ens\./, '')}
                    </label>
                    {validation && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        validation.isValid ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {validation.message}
                      </span>
                    )}
                  </div>
                  
                  {editing ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setRecords(prev => ({
                          ...prev,
                          [key]: newValue
                        }));
                        setValidationResults(prev => ({
                          ...prev,
                          [key]: validateRecord(key, newValue)
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                               text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                               focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Enter ${key}...`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-slate-700/50 rounded-lg text-slate-300 break-all">
                        {value || (
                          <span className="text-slate-500">Not set</span>
                        )}
                      </div>
                    </div>
                  )}

                  {suggestion && !value && (
                    <div className="flex items-start space-x-2 text-sm">
                      <span className="text-indigo-400">💡</span>
                      <span className="text-slate-400">{suggestion}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ENSTextRecords;