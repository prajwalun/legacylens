// Cache utility for storing API responses
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cached data if it exists and is not expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const entry: CacheEntry = JSON.parse(content);
    
    // Check if cache is expired
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      // Cache expired, delete it
      await fs.unlink(filePath).catch(() => {});
      return null;
    }
    
    return entry.data as T;
  } catch (error) {
    // Cache miss or error reading
    return null;
  }
}

/**
 * Store data in cache with timestamp
 */
export async function setCache(key: string, data: any): Promise<void> {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    
    // Ensure the directory for this specific file exists (handles nested paths)
    const fileDir = path.dirname(filePath);
    await fs.mkdir(fileDir, { recursive: true });
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
  } catch (error) {
    // Silent fail - caching is optional
    console.error('Failed to write cache:', error);
  }
}

/**
 * Clear all cache files
 */
export async function clearCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(f => fs.unlink(path.join(CACHE_DIR, f)))
    );
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

