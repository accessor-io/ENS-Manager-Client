import { CcipCrossChainBridge as TCcipCrossChainBridge } from "../api/ccipCrossChainBridge/CcipCrossChainBridge";

export const CCIPCROSSCHAINBRIDGE_TITLE_FIELD = "id";

export const CcipCrossChainBridgeTitle = (
  record: TCcipCrossChainBridge
): string => {
  return record.id?.toString() || String(record.id);
};
