import { Request, Response } from 'express';
import logger from '../utils/logger';
import ecrBridgeService from '../services/ecrBridge.service';

/**
 * Handles POST /z-report request
 * Generates a Z report file in the Bon directory
 */
export async function handleZReportRequest(
  req: Request,
  res: Response
): Promise<void> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('Z Report request received', {
      requestId,
      ip: req.ip,
    });

    // Generate Z report file
    const filename = ecrBridgeService.generateZReportFile();
    
    if (!filename) {
      logger.error('Failed to generate Z report file', {
        requestId,
      });
      res.status(500).json({
        status: 'error',
        message: 'Eroare la generarea fișierului raport Z',
        details: 'Nu s-a putut crea fișierul pentru ECR Bridge',
      });
      return;
    }

    logger.info('Z Report file generated successfully', {
      requestId,
      filename,
    });

    res.status(200).json({
      status: 'success',
      message: 'Raport Z generat cu succes',
      file: filename,
    });
  } catch (error) {
    logger.error('Error handling Z report request', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă la generarea raportului Z',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

