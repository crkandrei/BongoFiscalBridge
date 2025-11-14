import { Router } from 'express';
import { handlePrintRequest } from '../controllers/print.controller';
import { handleZReportRequest } from '../controllers/z-report.controller';

const router = Router();

/**
 * POST /print
 * Endpoint for printing fiscal receipts
 * 
 * Request body:
 * {
 *   "productName": "Ora de joacă",
 *   "duration": "1h 15m",
 *   "price": 22.50,
 *   "paymentType": "CASH" | "CARD"
 * }
 */
router.post('/print', handlePrintRequest);

/**
 * POST /z-report
 * Endpoint for generating Z report
 * 
 * No request body required
 */
router.post('/z-report', handleZReportRequest);

export default router;

