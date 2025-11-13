import { Request, Response } from 'express';
import logger from '../utils/logger';
import { validatePrintRequest } from '../utils/validator';
import ecrBridgeService from '../services/ecrBridge.service';
import { config } from '../config/config';

/**
 * Handles POST /print request
 * Validates input, generates receipt file, waits for response
 */
export async function handlePrintRequest(
  req: Request,
  res: Response
): Promise<void> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('Print request received', {
      requestId,
      body: req.body,
      ip: req.ip,
    });

    // Validate input
    const validation = validatePrintRequest(req.body);
    if (!validation.success || !validation.data) {
      logger.warn('Validation failed', {
        requestId,
        error: validation.error,
      });
      res.status(400).json({
        status: 'error',
        message: 'Invalid request data',
        details: validation.error,
      });
      return;
    }

    const printData = validation.data;

    // Generate receipt file
    const filename = ecrBridgeService.generateReceiptFile(printData);
    if (!filename) {
      logger.error('Failed to generate receipt file', {
        requestId,
        printData,
      });
      res.status(500).json({
        status: 'error',
        message: 'Eroare la generarea fișierului bon',
        details: 'Nu s-a putut crea fișierul pentru ECR Bridge',
      });
      return;
    }

    // Generate the command that was sent (for validation)
    // Format matches the official Datecs format
    const fiscalCode = config.ecrBridge.fiscalCode;
    const headerLine = fiscalCode ? `FISCAL;${fiscalCode}` : 'FISCAL';
    const formattedPrice = printData.price.toString().replace(',', '.');
    const itemLine = `I;${printData.productName} (${printData.duration});1;${formattedPrice};1`;
    const paymentLine = 'P;1;0';
    const sentCommand = `${headerLine}\n${itemLine}\n${paymentLine}`;

    logger.info('Receipt file generated, waiting for response', {
      requestId,
      filename,
      sentCommand,
    });

    // Wait for ECR Bridge response
    // Pass the sent command to verify the error file corresponds to this receipt
    try {
      const response = await ecrBridgeService.waitForResponse(filename, sentCommand);

      if (response.success) {
        logger.info('Print request completed successfully', {
          requestId,
          filename,
        });
        res.status(200).json({
          status: 'success',
          message: 'Bon fiscal emis',
          file: filename,
        });
      } else {
        logger.error('ECR Bridge returned error', {
          requestId,
          filename,
          details: response.details,
        });
        res.status(500).json({
          status: 'error',
          message: 'Eroare la imprimare',
          details: response.details || 'Eroare necunoscută de la ECR Bridge',
        });
      }
    } catch (error) {
      // Timeout or other error while waiting
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error waiting for ECR Bridge response', {
        requestId,
        filename,
        error: errorMessage,
      });
      res.status(504).json({
        status: 'error',
        message: 'Timeout la așteptarea răspunsului',
        details: errorMessage,
      });
    }
  } catch (error) {
    // Unexpected error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Unexpected error in print request', {
      requestId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      details: 'A apărut o eroare neașteptată',
    });
  }
}

