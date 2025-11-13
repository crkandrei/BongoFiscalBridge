# Parsarea Fișierelor de Eroare ECR Bridge

## Formatul Fișierului de Eroare (.ERR)

Fișierele de eroare generate de ECR Bridge au următorul format:

```
I;{productName} ({duration});1;{price};19; P;

-------------------------------------

Execution Log

-------------------------------------

{timestamp} - ERROR: {error message}
```

### Exemplu Real:

```
I;Ora de joacă (2h);1;60;19; P;

-------------------------------------

Execution Log

-------------------------------------

11/13/2025 1:53:34 AM - ERROR: I can't read the serial number. 
```

## Structura Fișierului

1. **Prima linie**: Comanda originală trimisă către ECR Bridge
   - Format: `I;{productName} ({duration});1;{price};19; P;`
   - Aceasta este exact comanda care a fost trimisă și a generat eroarea

2. **Separator**: Linii cu caractere `-` pentru separare vizuală

3. **Header**: "Execution Log" - indică începutul secțiunii de log

4. **Mesajul de eroare**: 
   - Format: `{MM/DD/YYYY HH:MM:SS AM/PM} - ERROR: {mesaj}`
   - Conține timestamp-ul exact când a apărut eroarea
   - Conține mesajul descriptiv al erorii

## Cum se Parsează

Aplicația folosește funcția `parseErrorFile()` din `src/utils/errorParser.ts` pentru a extrage informațiile relevante.

### Funcții Disponibile

#### `parseErrorFile(errorContent: string): ParsedError`

Parsează întregul conținut al fișierului de eroare și returnează un obiect structurat:

```typescript
interface ParsedError {
  originalCommand: string;    // Comanda originală (prima linie)
  timestamp?: string;         // Timestamp-ul erorii (dacă există)
  errorMessage: string;       // Mesajul de eroare extras
  rawContent: string;          // Conținutul brut al fișierului
}
```

**Exemplu de utilizare:**

```typescript
import { parseErrorFile } from '../utils/errorParser';

const errorContent = fs.readFileSync('bon_123456.ERR', 'utf8');
const parsed = parseErrorFile(errorContent);

console.log(parsed.errorMessage); 
// Output: "I can't read the serial number."
```

#### `extractErrorMessage(errorContent: string): string`

Funcție simplificată care returnează doar mesajul de eroare (fără alte detalii).

**Exemplu de utilizare:**

```typescript
import { extractErrorMessage } from '../utils/errorParser';

const errorContent = fs.readFileSync('bon_123456.ERR', 'utf8');
const errorMessage = extractErrorMessage(errorContent);

console.log(errorMessage); 
// Output: "I can't read the serial number."
```

## Integrare în Aplicație

Parserul este integrat automat în `ecrBridgeService.waitForResponse()`. Când un fișier `.ERR` este detectat:

1. Fișierul este citit
2. Conținutul este parsat folosind `parseErrorFile()`
3. Mesajul de eroare extras este returnat în răspunsul API
4. Detaliile complete sunt logate pentru debugging

### Răspuns API la Eroare

Când apare o eroare, API-ul returnează:

```json
{
  "status": "error",
  "message": "Eroare la imprimare",
  "details": "I can't read the serial number."
}
```

Câmpul `details` conține mesajul de eroare extras din fișierul `.ERR`.

## Logging

Toate erorile sunt logate cu detalii complete:

```json
{
  "level": "error",
  "message": "ECR Bridge returned error",
  "filename": "bon_20251113015026.txt",
  "errFilePath": "C:/ECRBridge/BonErr/bon_20251113015026.ERR",
  "errorContent": "...",
  "parsedError": {
    "originalCommand": "I;Ora de joacă (2h);1;60;19; P;",
    "timestamp": "11/13/2025 1:53:34 AM",
    "errorMessage": "I can't read the serial number."
  }
}
```

## Cazuri Speciale

### Fișier Fără Secțiune "Execution Log"

Dacă fișierul nu conține secțiunea "Execution Log", întregul conținut este returnat ca mesaj de eroare.

### Multiple Erori

Dacă există multiple linii de eroare, prima eroare găsită este returnată (cu timestamp-ul asociat).

### Format Neașteptat

Parserul este robust și va încerca să extragă orice informație utilă, chiar dacă formatul nu este exact cel așteptat.

