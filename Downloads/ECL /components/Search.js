import React, { useState } from 'react';
import { searchENS, searchAttestations } from '../utils/customContracts';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ ens: [], attestations: [] });

  const handleSearch = async () => {
    const ensResults = await searchENS(query);
    const attestationResults = await searchAttestations(query);
    setResults({ ens: ensResults, attestations: attestationResults });
  };

  return (
    <div>
      <h2>Search</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search query" />
      <button onClick={handleSearch}>Search</button>
      <h3>ENS Results</h3>
      <ul>
        {results.ens.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
      <h3>Attestation Results</h3>
      <ul>
        {results.attestations.map((result, index) => (
          <li key={index}>{result.schema}: {result.recipient}</li>
        ))}
      </ul>
    </div>
  );
};

export default Search;