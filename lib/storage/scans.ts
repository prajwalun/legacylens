// File-based storage for scan results
import fs from 'fs/promises';
import path from 'path';
import type { ScanResult } from '@/types';
import { DEMO_SCANS } from '@/lib/demo/mock-data';

const SCANS_FILE = path.join(process.cwd(), 'data', 'scans.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  const dir = path.dirname(SCANS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Read all scans from storage
 * Includes both real scans and demo scans
 */
export async function getAllScans(): Promise<Record<string, ScanResult>> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SCANS_FILE, 'utf-8');
    const realScans = JSON.parse(data);
    
    // Merge demo scans with real scans (real scans take precedence)
    return { ...DEMO_SCANS, ...realScans };
  } catch (error) {
    // File doesn't exist yet, return just demo scans
    return DEMO_SCANS;
  }
}

/**
 * Get a single scan by ID
 */
export async function getScan(id: string): Promise<ScanResult | null> {
  const scans = await getAllScans();
  return scans[id] || null;
}

/**
 * Save a new scan or overwrite existing one
 * Note: Demo scans are not saved to file
 */
export async function saveScan(scan: ScanResult): Promise<void> {
  // Don't save demo scans to file
  if (scan.id.startsWith('demo-')) {
    return;
  }
  
  await ensureDataDir();
  const allScans = await getAllScans();
  
  // Only save non-demo scans
  const realScans: Record<string, ScanResult> = {};
  for (const [id, scanData] of Object.entries(allScans)) {
    if (!id.startsWith('demo-')) {
      realScans[id] = scanData;
    }
  }
  
  realScans[scan.id] = scan;
  await fs.writeFile(SCANS_FILE, JSON.stringify(realScans, null, 2));
}

/**
 * Update a scan with partial data
 * Note: Demo scans cannot be updated
 */
export async function updateScan(
  id: string,
  updates: Partial<ScanResult>
): Promise<void> {
  // Don't update demo scans
  if (id.startsWith('demo-')) {
    return;
  }
  
  const allScans = await getAllScans();
  if (!allScans[id]) {
    throw new Error(`Scan ${id} not found`);
  }
  
  // Only save non-demo scans
  const realScans: Record<string, ScanResult> = {};
  for (const [scanId, scanData] of Object.entries(allScans)) {
    if (!scanId.startsWith('demo-')) {
      realScans[scanId] = scanData;
    }
  }
  
  realScans[id] = { ...realScans[id], ...updates };
  await fs.writeFile(SCANS_FILE, JSON.stringify(realScans, null, 2));
}

/**
 * Delete a scan
 * Note: Demo scans cannot be deleted
 */
export async function deleteScan(id: string): Promise<void> {
  // Don't delete demo scans
  if (id.startsWith('demo-')) {
    return;
  }
  
  const allScans = await getAllScans();
  
  // Only save non-demo scans (excluding the one to delete)
  const realScans: Record<string, ScanResult> = {};
  for (const [scanId, scanData] of Object.entries(allScans)) {
    if (!scanId.startsWith('demo-') && scanId !== id) {
      realScans[scanId] = scanData;
    }
  }
  
  await fs.writeFile(SCANS_FILE, JSON.stringify(realScans, null, 2));
}

/**
 * Get list of all scan IDs
 */
export async function getScanIds(): Promise<string[]> {
  const scans = await getAllScans();
  return Object.keys(scans);
}

/**
 * Clear all scans (for testing)
 */
export async function clearAllScans(): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SCANS_FILE, JSON.stringify({}, null, 2));
}

