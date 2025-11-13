import { config as loadEnv } from 'dotenv';
import * as path from 'path';

// Load environment variables
loadEnv();

/**
 * Application configuration loaded from environment variables
 */
export const config = {
  // Server port
  port: parseInt(process.env.PORT || '9000', 10),

  // ECR Bridge file paths
  ecrBridge: {
    bonPath: process.env.ECR_BRIDGE_BON_PATH || 'C:/ECRBridge/Bon/',
    bonOkPath: process.env.ECR_BRIDGE_BON_OK_PATH || 'C:/ECRBridge/BonOK/',
    bonErrPath: process.env.ECR_BRIDGE_BON_ERR_PATH || 'C:/ECRBridge/BonErr/',
    fiscalCode: process.env.ECR_BRIDGE_FISCAL_CODE || undefined,
  },

  // Response timeout in milliseconds
  responseTimeout: parseInt(process.env.RESPONSE_TIMEOUT || '10000', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: path.join(process.cwd(), 'logs'),
};

// Validate required configuration
if (!config.ecrBridge.bonPath) {
  throw new Error('ECR_BRIDGE_BON_PATH is required in .env file');
}

if (!config.ecrBridge.bonOkPath) {
  throw new Error('ECR_BRIDGE_BON_OK_PATH is required in .env file');
}

if (!config.ecrBridge.bonErrPath) {
  throw new Error('ECR_BRIDGE_BON_ERR_PATH is required in .env file');
}

