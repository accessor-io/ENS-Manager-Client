import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { AttestationManager } from '@/services/attestation/AttestationManager';
import { ProjectStandards, StandardsEnforcer } from '@/config/standards';
import structlog from 'structlog';

const logger = structlog.getLogger().bind({
  service: 'attestations-api',
  version: '1.0.0'
});

// Initialize attestation manager
const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id'
);
const attestationManager = new AttestationManager(provider);

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'create':
        return await handleCreateAttestation(data);
      case 'getByAsset':
        return await handleGetAssetAttestations(data.asset);
      case 'getByOwner':
        return await handleGetOwnerAttestations(data.owner);
      case 'revoke':
        return await handleRevokeAttestation(data.attestationUID);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    logger.error('api_error', {
      error: error.message,
      path: '/api/attestations'
    });

    return NextResponse.json(
      StandardsEnforcer.formatError('ENS_RESOLUTION_FAILED', 'Attestation operation failed'),
      { status: 500 }
    );
  }
}

async function handleCreateAttestation(data: any) {
  const txHash = await attestationManager.createAttestation(data);
  return NextResponse.json({
    success: true,
    data: { transactionHash: txHash },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
}

async function handleGetAssetAttestations(asset: string) {
  const attestations = await attestationManager.getAssetAttestations(asset);
  return NextResponse.json({
    success: true,
    data: attestations,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
}

async function handleGetOwnerAttestations(owner: string) {
  const attestations = await attestationManager.getOwnerAttestations(owner);
  return NextResponse.json({
    success: true,
    data: attestations,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
}

async function handleRevokeAttestation(attestationUID: string) {
  const txHash = await attestationManager.revokeAttestation(attestationUID);
  return NextResponse.json({
    success: true,
    data: { transactionHash: txHash },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
} 