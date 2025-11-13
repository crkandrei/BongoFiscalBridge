/**
 * Test file demonstrating error parser usage
 * This file shows how to parse ECR Bridge error files
 */

import { parseErrorFile, extractErrorMessage } from '../errorParser';

// Example error file content (matches the format you provided)
const exampleErrorContent = `I;Ora de joacă (2h);1;60;19; P;

-------------------------------------

Execution Log

-------------------------------------

11/13/2025 1:53:34 AM - ERROR: I can't read the serial number. `;

/**
 * Example usage of the error parser
 */
function demonstrateErrorParsing() {
  console.log('=== Error Parser Demonstration ===\n');
  
  // Parse the full error file
  const parsed = parseErrorFile(exampleErrorContent);
  
  console.log('Parsed Error Object:');
  console.log('- Original Command:', parsed.originalCommand);
  console.log('- Timestamp:', parsed.timestamp || 'N/A');
  console.log('- Error Message:', parsed.errorMessage);
  console.log('\n');
  
  // Extract just the error message
  const errorMessage = extractErrorMessage(exampleErrorContent);
  console.log('Extracted Error Message:', errorMessage);
  console.log('\n');
  
  // Example with multiple errors
  const multiErrorContent = `I;Test Product (1h);1;50;19; P;

-------------------------------------

Execution Log

-------------------------------------

11/13/2025 2:00:00 AM - ERROR: First error occurred.
11/13/2025 2:00:01 AM - ERROR: Second error occurred.`;
  
  const parsedMulti = parseErrorFile(multiErrorContent);
  console.log('Multiple Errors Example:');
  console.log('- Error Message:', parsedMulti.errorMessage);
}

// Uncomment to run demonstration:
// demonstrateErrorParsing();

export { exampleErrorContent };

