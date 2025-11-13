/**
 * Utility functions for parsing ECR Bridge error files (.ERR)
 * 
 * Error file format:
 * I;{productName} ({duration});1;{price};19; P;
 * 
 * -------------------------------------
 * 
 * Execution Log
 * 
 * -------------------------------------
 * 
 * {timestamp} - ERROR: {error message}
 */

export interface ParsedError {
  originalCommand: string;
  timestamp?: string;
  errorMessage: string;
  rawContent: string;
}

/**
 * Parses an ECR Bridge error file and extracts the error message
 * @param errorContent - The raw content of the .ERR file
 * @returns Parsed error object with extracted information
 */
export function parseErrorFile(errorContent: string): ParsedError {
  if (!errorContent || !errorContent.trim()) {
    return {
      originalCommand: '',
      errorMessage: 'Unknown error from ECR Bridge',
      rawContent: errorContent,
    };
  }

  const lines = errorContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract original command (first line)
  const originalCommand = lines[0] || '';

  // Find the "Execution Log" section
  const executionLogIndex = lines.findIndex(line => 
    line.toLowerCase().includes('execution log')
  );

  if (executionLogIndex === -1) {
    // No execution log section found, return the whole content as error
    return {
      originalCommand,
      errorMessage: errorContent.trim() || 'Unknown error from ECR Bridge',
      rawContent: errorContent,
    };
  }

  // Look for error lines after the execution log header
  // Error lines typically have format: "{date} {time} - ERROR: {message}"
  const errorLines: string[] = [];
  
  for (let i = executionLogIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip separator lines (lines with only dashes or empty)
    if (line.match(/^-+$/) || line.length === 0) {
      continue;
    }
    
    // Check if this line contains an error
    // Format: "MM/DD/YYYY HH:MM:SS AM/PM - ERROR: message"
    const errorMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)\s*-\s*ERROR:\s*(.+)/i);
    
    if (errorMatch) {
      const timestamp = errorMatch[1];
      const errorMessage = errorMatch[2].trim();
      
      // Return immediately with the first error found (most common case)
      return {
        originalCommand,
        timestamp,
        errorMessage,
        rawContent: errorContent,
      };
    } else if (line.includes('ERROR:') || line.includes('error:')) {
      // Fallback: if line contains ERROR but doesn't match the exact format
      const errorPart = line.split(/ERROR:\s*/i)[1] || line;
      errorLines.push(errorPart.trim());
    }
  }

  // If we found error lines, combine them
  if (errorLines.length > 0) {
    return {
      originalCommand,
      errorMessage: errorLines.join('; '),
      rawContent: errorContent,
    };
  }

  // Fallback: return content after execution log
  const remainingContent = lines.slice(executionLogIndex + 1)
    .filter(line => !line.match(/^-+$/))
    .join(' ')
    .trim();

  return {
    originalCommand,
    errorMessage: remainingContent || 'Unknown error from ECR Bridge',
    rawContent: errorContent,
  };
}

/**
 * Extracts just the error message from an error file content
 * This is a convenience function that returns only the error message string
 * @param errorContent - The raw content of the .ERR file
 * @returns The extracted error message
 */
export function extractErrorMessage(errorContent: string): string {
  const parsed = parseErrorFile(errorContent);
  return parsed.errorMessage;
}

