import fs from 'fs';
import path from 'path';
import logger from './logger';

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - The directory path to ensure exists
 * @returns true if directory exists or was created, false on error
 */
export function ensureDirectoryExists(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(`Failed to create directory: ${dirPath}`, { error });
    return false;
  }
}

/**
 * Safely writes content to a file
 * @param filePath - The full path to the file
 * @param content - The content to write
 * @returns true if successful, false on error
 */
export function writeFileSafe(filePath: string, content: string): boolean {
  try {
    // Ensure parent directory exists
    const dirPath = path.dirname(filePath);
    if (!ensureDirectoryExists(dirPath)) {
      return false;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    logger.info(`File written successfully: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to write file: ${filePath}`, { error });
    return false;
  }
}

/**
 * Safely reads a file
 * @param filePath - The full path to the file
 * @returns File content as string, or null on error
 */
export function readFileSafe(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    logger.error(`Failed to read file: ${filePath}`, { error });
    return null;
  }
}

/**
 * Checks if a file exists
 * @param filePath - The full path to the file
 * @returns true if file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    logger.error(`Error checking file existence: ${filePath}`, { error });
    return false;
  }
}

