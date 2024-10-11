import { ethers } from 'ethers';
import { getENSContract } from './ethereumService';

export const getENSRegistry = (address, signer) => {
  const abi = [/* ENS Registry ABI */];
  return getENSContract(address, abi, signer);
};

export const resolveENSName = async (provider, name) => {
  try {
    const address = await provider.resolveName(name);
    return address;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
};

export const lookupAddress = async (provider, address) => {
  try {
    const name = await provider.lookupAddress(address);
    return name;
  } catch (error) {
    console.error('Error looking up ENS name for address:', error);
    return null;
  }
};

// Add other ENS-related functions here

export const reverseResolveENS = async (provider, address) => {
  const name = await lookupAddress(provider, address);
  return name;
};  