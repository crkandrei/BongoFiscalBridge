import { z } from 'zod';
import logger from './logger';

/**
 * Payment type enum - only CASH and CARD are supported
 */
export enum PaymentType {
  CASH = 'CASH',
  CARD = 'CARD',
}

/**
 * Schema for validating print request input
 */
export const printRequestSchema = z.object({
  productName: z
    .string()
    .min(1, 'Product name is required and cannot be empty'),
  duration: z.string().min(1, 'Duration is required and cannot be empty'),
  price: z
    .number()
    .positive('Price must be a positive number')
    .finite('Price must be a finite number'),
  paymentType: z.nativeEnum(PaymentType, {
    errorMap: () => ({
      message: 'Payment type must be either CASH or CARD',
    }),
  }),
});

/**
 * Type inference from Zod schema
 */
export type PrintRequest = z.infer<typeof printRequestSchema>;

/**
 * Validates print request data
 * @param data - The data to validate
 * @returns Object with success flag and either validated data or error message
 */
export function validatePrintRequest(data: unknown): {
  success: boolean;
  data?: PrintRequest;
  error?: string;
} {
  try {
    const validatedData = printRequestSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      logger.warn('Validation error', { error: errorMessage, data });
      return { success: false, error: errorMessage };
    }
    logger.error('Unexpected validation error', { error });
    return { success: false, error: 'Invalid request data' };
  }
}

