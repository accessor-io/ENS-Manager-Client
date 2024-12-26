import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Attestation = ({ contract, account }) => {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState({
    recipient: '',
    expirationTime: '',
    revocable: true,
    refUID: '',
    data: ''
  });
  const [validationResults, setValidationResults] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [attestationScore, setAttestationScore] = useState(0);

  // Predefined attestation templates
  const TEMPLATES = {
    'identity': {
      name: 'Identity Verification',
      schema: '0x123...', // Replace with actual schema
      fields: ['name', 'country', 'documentType'],
      description: 'Verify the identity of an address owner'
    },
    'skills': {
      name: 'Skills & Expertise',
      schema: '0x456...', // Replace with actual schema
      fields: ['skills', 'level', 'experience'],
      description: 'Attest to professional skills and expertise'
    },
    'contribution': {
      name: 'Project Contribution',
      schema: '0x789...', // Replace with actual schema
      fields: ['project', 'role', 'duration'],
      description: 'Verify contributions to Web3 projects'
    }
  };

  // AI-powered validation
  const validateAttestation = (data) => {
    const validation = {
      isValid: true,
      messages: []
    };

    // Validate recipient address
    if (!ethers.utils.isAddress(data.recipient)) {
      validation.isValid = false;
      validation.messages.push('Invalid recipient address');
    }

    // Validate expiration time
    const expTime = new Date(data.expirationTime);
    if (isNaN(expTime.getTime()) || expTime < new Date()) {
      validation.isValid = false;
      validation.messages.push('Invalid expiration time');
    }

    // Validate data format based on template
    if (selectedTemplate) {
      const template = TEMPLATES[selectedTemplate];
      try {
        const parsedData = JSON.parse(data.data);
        template.fields.forEach(field => {
          if (!parsedData[field]) {
            validation.messages.push(`Missing required field: ${field}`);
            validation.isValid = false;
          }
        });
      } catch {
        validation.isValid = false;
        validation.messages.push('Invalid JSON data format');
      }
    }

    return validation;
  };

  // AI-powered suggestions generator
  const generateSuggestions = (data) => {
    const newSuggestions = [];

    // Suggest template if none selected
    if (!selectedTemplate) {
      newSuggestions.push({
        type: 'template',
        message: 'Select a template to streamline attestation creation'
      });
    }

    // Suggest expiration time if not set
    if (!data.expirationTime) {
      newSuggestions.push({
        type: 'expiration',
        message: 'Set an expiration time to enhance attestation security'
      });
    }

    // Suggest making attestation revocable for sensitive data
    if (!data.revocable && selectedTemplate === 'identity') {
      newSuggestions.push({
        type: 'revocable',
        message: 'Consider making identity attestations revocable for security'
      });
    }

    return newSuggestions;
  };

  // Calculate attestation strength score
  const calculateAttestationScore = (data) => {
    let score = 0;
    const weights = {
      hasTemplate: 20,
      hasExpiration: 20,
      isRevocable: 15,
      validRecipient: 15,
      dataCompleteness: 30
    };

    if (selectedTemplate) score += weights.hasTemplate;
    if (data.expirationTime) score += weights.hasExpiration;
    if (data.revocable) score += weights.isRevocable;
    if (ethers.utils.isAddress(data.recipient)) score += weights.validRecipient;

    // Check data completeness
    if (data.data) {
      try {
        const parsedData = JSON.parse(data.data);
        const template = TEMPLATES[selectedTemplate];
        if (template) {
          const filledFields = template.fields.filter(field => parsedData[field]);
          score += (filledFields.length / template.fields.length) * weights.dataCompleteness;
        }
      } catch {}
    }

    return Math.round(score);
  };

  // Handle form changes
  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Update validation
    const validation = validateAttestation(newData);
    setValidationResults(validation);
    
    // Update suggestions
    const newSuggestions = generateSuggestions(newData);
    setSuggestions(newSuggestions);
    
    // Update score
    const score = calculateAttestationScore(newData);
    setAttestationScore(score);
  };

  // Create attestation
  const createAttestation = async () => {
    const validation = validateAttestation(formData);
    if (!validation.isValid) {
      alert('Please fix validation errors before creating attestation');
      return;
    }

    setLoading(true);
    try {
      const template = TEMPLATES[selectedTemplate];
      const attestationData = {
        schema: template.schema,
        data: JSON.parse(formData.data),
        recipient: formData.recipient,
        expirationTime: new Date(formData.expirationTime).getTime() / 1000,
        revocable: formData.revocable,
        refUID: formData.refUID || ethers.constants.HashZero
      };

      const tx = await contract.createAttestation(
        attestationData.schema,
        attestationData.recipient,
        attestationData.expirationTime,
        attestationData.revocable,
        attestationData.refUID,
        JSON.stringify(attestationData.data)
      );

      await tx.wait();
      alert('Attestation created successfully!');
      
      // Reset form
      setFormData({
        recipient: '',
        expirationTime: '',
        revocable: true,
        refUID: '',
        data: ''
      });
      setSelectedTemplate('');
    } catch (error) {
      console.error('Error creating attestation:', error);
      alert('Error creating attestation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Attestation Score */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Attestation Strength</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-slate-200">{attestationScore}/100</div>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${attestationScore}%` }}
          />
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Select Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key)}
              className={`p-4 rounded-lg border transition-colors ${
                selectedTemplate === key
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <h4 className="font-medium mb-2">{template.name}</h4>
              <p className="text-sm opacity-80">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Attestation Form */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Create Attestation</h3>
        <div className="space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => handleChange('recipient', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                       text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent"
              placeholder="0x..."
            />
          </div>

          {/* Expiration Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Expiration Time
            </label>
            <input
              type="datetime-local"
              value={formData.expirationTime}
              onChange={(e) => handleChange('expirationTime', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                       text-slate-200 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Revocable Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="revocable"
              checked={formData.revocable}
              onChange={(e) => handleChange('revocable', e.target.checked)}
              className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="revocable" className="text-sm font-medium text-slate-300">
              Make attestation revocable
            </label>
          </div>

          {/* Reference UID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reference UID (Optional)
            </label>
            <input
              type="text"
              value={formData.refUID}
              onChange={(e) => handleChange('refUID', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                       text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent"
              placeholder="0x..."
            />
          </div>

          {/* Attestation Data */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Attestation Data (JSON)
            </label>
            <textarea
              value={formData.data}
              onChange={(e) => handleChange('data', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                       text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:border-transparent font-mono"
              placeholder={selectedTemplate ? 
                `{\n  ${TEMPLATES[selectedTemplate].fields.map(f => `"${f}": ""`).join(',\n  ')}\n}` :
                '{\n  "field": "value"\n}'
              }
            />
          </div>

          {/* Validation Messages */}
          {validationResults.messages?.length > 0 && (
            <div className="space-y-2">
              {validationResults.messages.map((message, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-red-400">
                  <span>•</span>
                  <span>{message}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-indigo-400">
                  <span>💡</span>
                  <span>{suggestion.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={createAttestation}
            disabled={loading || !validationResults.isValid}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              loading || !validationResults.isValid
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Creating Attestation...</span>
              </div>
            ) : (
              'Create Attestation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Attestation;