import { Router } from 'express';
import { handlePrintRequest } from '../controllers/print.controller';

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

export default router;

