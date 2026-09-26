import crypto from 'crypto';

/**
 * Enterprise Sequential & Secure ID Generator for HostelOps
 * Generates clean, human-readable institutional identifiers
 */

const COUNTERS = {
  AST: 100,
  TKT: 400,
  REQ: 300,
  AUD: 900,
  TRF: 500,
  DSP: 200,
  RES: 100,
  INC: 50,
  VND: 10,
  PO: 100,
};

export function generateInstitutionalId(prefix = 'AST') {
  const year = new Date().getFullYear();
  COUNTERS[prefix] = (COUNTERS[prefix] || 100) + 1;
  const randomSuffix = crypto.randomInt(100, 999);
  const sequence = String(COUNTERS[prefix]).padStart(4, '0');
  return `${prefix}-${year}-${sequence}${randomSuffix}`;
}

export const generateAssetTag = (block = 'A', room = '101', cat = 'EQ') => {
  const cleanBlock = block.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  const cleanRoom = room.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanCat = cat.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  const rand = crypto.randomInt(10, 99);
  return `AST-${cleanBlock}${cleanRoom}-${cleanCat}-${rand}`;
};

export const generateTicketId = () => generateInstitutionalId('TKT');
export const generateRequestId = () => generateInstitutionalId('REQ');
export const generateAuditId = () => generateInstitutionalId('AUD');
export const generateTransferId = () => generateInstitutionalId('TRF');
export const generateDisposalId = () => generateInstitutionalId('DSP');
export const generateResidentId = () => generateInstitutionalId('RES');
export const generateIncidentId = () => generateInstitutionalId('INC');
export const generateVendorId = () => generateInstitutionalId('VND');
export const generatePOId = () => generateInstitutionalId('PO');
