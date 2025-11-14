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

    // Get bridge mode from config
    const bridgeMode = config.bridgeMode as 'live' | 'test';

    // Generate receipt file
    const filename = ecrBridgeService.generateReceiptFile(printData, bridgeMode);
    if (!filename) {
      logger.error('Failed to generate receipt file', {
        requestId,
        printData,
        bridgeMode,
      });
      
      // Return appropriate error response based on mode
      if (bridgeMode === 'test') {
        res.status(500).json({
          status: 'error',
          mode: 'test',
          reason: 'bridge_failed',
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Eroare la generarea fișierului bon',
          details: 'Nu s-a putut crea fișierul pentru ECR Bridge',
        });
      }
      return;
    }

    // Generate the command that was sent (for validation)
    // Format depends on mode
    let sentCommand: string;
    if (bridgeMode === 'live') {
      // Format matches the official Datecs format
      const fiscalCode = config.ecrBridge.fiscalCode;
      const headerLine = fiscalCode ? `FISCAL;${fiscalCode}` : 'FISCAL';
      const formattedPrice = printData.price.toString().replace(',', '.');
      const itemLine = `I;${printData.productName} (${printData.duration});1;${formattedPrice};1`;
      // Payment code: 0 = CASH (Numerar), 1 = CARD (Card) - conform documentației Datecs
      const paymentCode = printData.paymentType === 'CASH' ? '0' : '1';
      const paymentLine = `P;${paymentCode};0`;
      sentCommand = `${headerLine}\n${itemLine}\n${paymentLine}`;
    } else {
      // TEST mode: Generate non-fiscal command for validation
      const formattedPrice = printData.price.toString().replace(',', '.');
      const lines: string[] = ['TEXT'];
      lines.push(`T;${printData.productName} (${printData.duration})     ${formattedPrice}`);
      lines.push('T;--------------------');
      lines.push(`T;TOTAL: ${formattedPrice}`);
      const paymentText = printData.paymentType === 'CASH' ? 'CASH' : 'CARD';
      lines.push(`T;Plata: ${paymentText}`);
      lines.push('T;Bon NON-FISCAL - TEST');
      sentCommand = lines.join('\n');
    }

    logger.info('Receipt file generated, waiting for response', {
      requestId,
      filename,
      sentCommand,
      bridgeMode,
    });

    // Wait for ECR Bridge response
    // Pass the sent command to verify the error file corresponds to this receipt
    try {
      const response = await ecrBridgeService.waitForResponse(filename, sentCommand);

      if (response.success) {
        logger.info('Print request completed successfully', {
          requestId,
          filename,
          bridgeMode,
        });
        
        // Return appropriate success response based on mode
        if (bridgeMode === 'test') {
          res.status(200).json({
            status: 'ok',
            mode: 'test',
          });
        } else {
          res.status(200).json({
            status: 'success',
            message: 'Bon fiscal emis',
            file: filename,
          });
        }
      } else {
        logger.error('ECR Bridge returned error', {
          requestId,
          filename,
          details: response.details,
          bridgeMode,
        });
        
        // Return appropriate error response based on mode
        if (bridgeMode === 'test') {
          res.status(500).json({
            status: 'error',
            mode: 'test',
            reason: 'bridge_failed',
          });
        } else {
          res.status(500).json({
            status: 'error',
            message: 'Eroare la imprimare',
            details: response.details || 'Eroare necunoscută de la ECR Bridge',
          });
        }
      }
    } catch (error) {
      // Timeout or other error while waiting
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error waiting for ECR Bridge response', {
        requestId,
        filename,
        error: errorMessage,
        bridgeMode,
      });
      
      // Return appropriate timeout response based on mode
      if (bridgeMode === 'test') {
        res.status(504).json({
          status: 'error',
          mode: 'test',
          reason: 'bridge_failed',
        });
      } else {
        res.status(504).json({
          status: 'error',
          message: 'Timeout la așteptarea răspunsului',
          details: errorMessage,
        });
      }
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

