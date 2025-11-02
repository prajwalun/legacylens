// File-based storage for scan results
import fs from 'fs/promises';
import path from 'path';
import type { ScanResult } from '@/types';
import { DEMO_SCANS } from '@/lib/demo/mock-data';

const SCANS_FILE = path.join(process.cwd(), 'data', 'scans.json');

// Simple file lock to prevent race conditions
let writeLock = Promise.resolve();

/**
 * Acquire lock before reading or writing
 */
async function withLock<T>(operation: () => Promise<T>): Promise<T> {
  // Wait for any pending operations
  await writeLock;
  
  // Create new lock for this operation
  let resolveNextLock: () => void;
  const nextLock = new Promise<void>(resolve => { resolveNextLock = resolve; });
  const previousLock = writeLock;
  writeLock = nextLock;
  
  try {
    return await operation();
  } finally {
    // Release the lock
    resolveNextLock!();
  }
}

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
 * Read real scans from disk (not including demo scans)
 * INTERNAL USE ONLY - always use within withLock()
 */
async function readRealScansFromDisk(): Promise<Record<string, ScanResult>> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SCANS_FILE, 'utf-8');
    
    // Validate JSON before parsing
    const parsed = JSON.parse(data);
    
    // Ensure it's an object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.error('[Storage] Invalid scans.json format, resetting to empty');
      await writeRealScansToDisk({});
      return {};
    }
    
    return parsed;
  } catch (error: any) {
    // Check if file doesn't exist vs JSON parse error
    if (error?.code === 'ENOENT') {
      console.log('[Storage] scans.json does not exist, creating new file');
      await writeRealScansToDisk({});
      return {};
    }
    // JSON parse error - corrupted file
    console.error('[Storage] Failed to read scans.json, resetting:', error?.message);
    await writeRealScansToDisk({});
    return {};
  }
}

/**
 * Write real scans to disk ATOMICALLY
 * INTERNAL USE ONLY - always use within withLock()
 */
async function writeRealScansToDisk(scans: Record<string, ScanResult>): Promise<void> {
  await ensureDataDir();
  
  // Write to temporary file first
  const tempFile = SCANS_FILE + '.tmp';
  const jsonData = JSON.stringify(scans, null, 2);
  
  try {
    // Write to temp file
    await fs.writeFile(tempFile, jsonData, 'utf-8');
    
    // Verify it's valid JSON before committing
    await fs.readFile(tempFile, 'utf-8').then(data => JSON.parse(data));
    
    // Atomic rename (replaces original file)
    await fs.rename(tempFile, SCANS_FILE);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw error;
  }
}

/**
 * Read all scans from storage
 * Includes both real scans and demo scans
 * NOW USES LOCK FOR CONSISTENCY
 */
export async function getAllScans(): Promise<Record<string, ScanResult>> {
  return withLock(async () => {
    const realScans = await readRealScansFromDisk();
    // Merge demo scans with real scans (real scans take precedence)
    return { ...DEMO_SCANS, ...realScans };
  });
}

/**
 * Get a single scan by ID
 * NOW USES LOCK FOR CONSISTENCY
 */
export async function getScan(id: string): Promise<ScanResult | null> {
  return withLock(async () => {
    // Check demo scans first
    if (DEMO_SCANS[id]) {
      return DEMO_SCANS[id];
    }
    
    // Read from disk with lock held
    const realScans = await readRealScansFromDisk();
    return realScans[id] || null;
  });
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
  
  return withLock(async () => {
    const realScans = await readRealScansFromDisk();
    realScans[scan.id] = scan;
    await writeRealScansToDisk(realScans);
  });
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
  
  return withLock(async () => {
    const realScans = await readRealScansFromDisk();
    
    if (!realScans[id]) {
      throw new Error(`Scan ${id} not found`);
    }
    
    // Merge updates
    realScans[id] = { ...realScans[id], ...updates };
    await writeRealScansToDisk(realScans);
  });
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
  
  return withLock(async () => {
    const realScans = await readRealScansFromDisk();
    delete realScans[id];
    await writeRealScansToDisk(realScans);
  });
}

/**
 * Get list of all scan IDs
 */
export async function getScanIds(): Promise<string[]> {
  return withLock(async () => {
    const realScans = await readRealScansFromDisk();
    const allScans = { ...DEMO_SCANS, ...realScans };
    return Object.keys(allScans);
  });
}

/**
 * Clear all scans (for testing)
 */
export async function clearAllScans(): Promise<void> {
  return withLock(async () => {
    await ensureDataDir();
    await writeRealScansToDisk({});
  });
}
