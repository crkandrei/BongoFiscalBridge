import path from 'path';
import { config } from '../config/config';
import logger from '../utils/logger';
import {
  writeFileSafe,
  readFileSafe,
  fileExists,
  ensureDirectoryExists,
} from '../utils/fileUtils';
import { PrintRequest } from '../utils/validator';

/**
 * Response from waiting for ECR Bridge response
 */
export interface ECRResponse {
  success: boolean;
  details?: string;
  filename: string;
}

/**
 * Service for interacting with ECR Bridge
 * Handles file generation and response monitoring
 */
class ECRBridgeService {
  /**
   * Generates a unique timestamp for filename
   * Format: YYYYMMDDHHmmss
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generates the ECR Bridge file content
   * Format: I;{productName} ({duration});1;{price};19; P;
   */
  private generateFileContent(data: PrintRequest): string {
    const { productName, duration, price } = data;
    // Format: I;{productName} ({duration});1;{price};19; P;
    return `I;${productName} (${duration});1;${price};19; P;`;
  }

  /**
   * Generates a receipt file for ECR Bridge
   * @param data - The print request data
   * @returns The generated filename (without path) or null on error
   */
  public generateReceiptFile(data: PrintRequest): string | null {
    try {
      // Ensure the Bon directory exists
      if (!ensureDirectoryExists(config.ecrBridge.bonPath)) {
        logger.error('Failed to ensure Bon directory exists');
        return null;
      }

      // Generate unique filename
      const timestamp = this.generateTimestamp();
      const filename = `bon_${timestamp}.txt`;
      const filePath = path.join(config.ecrBridge.bonPath, filename);

      // Generate file content
      const content = this.generateFileContent(data);

      // Write file
      if (!writeFileSafe(filePath, content)) {
        logger.error('Failed to write receipt file', { filename, filePath });
        return null;
      }

      logger.info('Receipt file generated successfully', {
        filename,
        filePath,
        content,
      });

      return filename;
    } catch (error) {
      logger.error('Error generating receipt file', { error, data });
      return null;
    }
  }

  /**
   * Waits for ECR Bridge response files (.OK or .ERR)
   * Uses polling mechanism for cross-platform compatibility
   * @param filename - The base filename (e.g., "bon_123456.txt")
   * @param timeout - Maximum wait time in milliseconds
   * @returns Promise that resolves with response status
   */
  public async waitForResponse(
    filename: string,
    timeout: number = config.responseTimeout
  ): Promise<ECRResponse> {
    return new Promise((resolve, reject) => {
      // Extract base name without extension
      const baseName = filename.replace(/\.txt$/, '');
      const okFilePath = path.join(
        config.ecrBridge.bonOkPath,
        `${baseName}.OK`
      );
      const errFilePath = path.join(
        config.ecrBridge.bonErrPath,
        `${baseName}.ERR`
      );

      // Ensure response directories exist
      ensureDirectoryExists(config.ecrBridge.bonOkPath);
      ensureDirectoryExists(config.ecrBridge.bonErrPath);

      const startTime = Date.now();
      const pollInterval = 200; // Check every 200ms

      logger.info('Waiting for ECR Bridge response', {
        filename,
        okFilePath,
        errFilePath,
        timeout,
      });

      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        // Check for timeout
        if (elapsed >= timeout) {
          clearInterval(checkInterval);
          logger.warn('Timeout waiting for ECR Bridge response', {
            filename,
            elapsed,
            timeout,
          });
          reject(
            new Error(
              `Timeout waiting for response after ${timeout}ms. File: ${filename}`
            )
          );
          return;
        }

        // Check for error file first (higher priority)
        if (fileExists(errFilePath)) {
          clearInterval(checkInterval);
          const errorContent = readFileSafe(errFilePath);
          logger.error('ECR Bridge returned error', {
            filename,
            errFilePath,
            errorContent,
          });
          resolve({
            success: false,
            details: errorContent || 'Unknown error from ECR Bridge',
            filename,
          });
          return;
        }

        // Check for success file
        if (fileExists(okFilePath)) {
          clearInterval(checkInterval);
          logger.info('ECR Bridge returned success', {
            filename,
            okFilePath,
            elapsed,
          });
          resolve({
            success: true,
            filename,
          });
          return;
        }
      }, pollInterval);
    });
  }
}

// Export singleton instance
export const ecrBridgeService = new ECRBridgeService();
export default ecrBridgeService;

