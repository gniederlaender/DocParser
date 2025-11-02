# Document Verification Implementation Plan

## Overview
Implement a new "Document Verification" use-case that allows users to upload multiple documents of different types and verify each against a checklist of criteria.

## Document Types & Checklists

### 1. Austrian Passport
**Checklist Items:**
1. ✅ Contains Austrian passport format/layout (red cover, Austrian coat of arms)
2. ✅ Has readable passport number (alphanumeric, typically 8-9 characters)
3. ✅ Contains clear photo of passport holder
4. ✅ Shows expiration date in valid format (DD.MM.YYYY or similar)
5. ✅ Contains personal information (name, date of birth, nationality)

### 2. Austrian ID-Card
**Checklist Items:**
1. ✅ Has Austrian ID-card format (credit-card size, Austrian design elements)
2. ✅ Contains readable ID number (correct format for Austrian ID)
3. ✅ Shows chip indicator (visible chip symbol or contactless indicator)
4. ✅ Contains personal information (name, date of birth, nationality)
5. ✅ Shows expiration date and issue date in valid format

### 3. Real-Estate Purchasing Contract
**Checklist Items:**
1. ✅ Contains buyer information (name, address, or company details)
2. ✅ Contains seller information (name, address, or company details)
3. ✅ Has property address or object description
4. ✅ Contains purchase price (numeric value clearly stated)
5. ✅ Includes contract date and/or notary information

## Architecture

### Backend Changes

#### 1. New Document Type Configuration
**File:** `backend/src/config/documentTypes.json`
- Add new document type: `document_verification`
- This is a special use-case that handles multiple document types

#### 2. Verification Checklists Configuration
**File:** `backend/src/config/verificationChecklists.json` (NEW)
```json
{
  "austrian_passport": {
    "items": [
      {
        "id": "format_layout",
        "label": "Contains Austrian passport format/layout",
        "description": "Document shows red cover, Austrian coat of arms, and standard passport design"
      },
      // ... 4 more items
    ]
  },
  "austrian_id_card": { ... },
  "real_estate_contract": { ... }
}
```

#### 3. Verification Prompt Templates
**Files:** 
- `backend/src/config/prompts/austrian_passport_verification_prompt.txt`
- `backend/src/config/prompts/austrian_id_card_verification_prompt.txt`
- `backend/src/config/prompts/real_estate_contract_verification_prompt.txt`

Each prompt will instruct the LLM to:
- Analyze the document
- Check each checklist item
- Return JSON with pass/fail status for each item
- Provide brief reason if an item fails

#### 4. New Verification Service
**File:** `backend/src/services/verificationService.ts` (NEW)
- Load verification checklists
- Process document verification requests
- Handle LLM calls for verification
- Return structured verification results

#### 5. New API Endpoint
**File:** `backend/src/routes/verify.ts` (NEW)
- `POST /api/verify`
- Accepts multiple files with document types
- Request format:
```json
{
  "documents": [
    {
      "file": File,
      "documentType": "austrian_passport"
    },
    {
      "file": File,
      "documentType": "austrian_id_card"
    },
    {
      "file": File,
      "documentType": "real_estate_contract"
    }
  ]
}
```
- Response format:
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentType": "austrian_passport",
        "fileName": "passport.pdf",
        "verified": true,
        "checklist": [
          {
            "id": "format_layout",
            "label": "Contains Austrian passport format/layout",
            "passed": true,
            "reason": "Document shows correct Austrian passport design"
          },
          // ... more items
        ],
        "passedCount": 5,
        "totalCount": 5,
        "processingTime": 1234
      },
      // ... more documents
    ],
    "overallVerified": true,
    "totalProcessingTime": 5432
  }
}
```

#### 6. Type Definitions
**File:** `backend/src/types/index.ts` (UPDATE)
Add:
- `VerificationChecklistItem`
- `VerificationResult`
- `VerificationResponse`
- `DocumentVerificationRequest`

### Frontend Changes

#### 1. New Verification Page Component
**File:** `frontend/src/components/DocumentVerificationPage.tsx` (NEW)
- Multiple upload fields (one for each document type)
- Each field has:
  - Label (e.g., "Austrian Passport")
  - File upload area
  - File name display when selected
  - Remove/clear button
- "Verify Documents" button (disabled until all required documents uploaded)
- Real-time validation

#### 2. Verification Display Component
**File:** `frontend/src/components/VerificationDisplay.tsx` (NEW)
- Shows verification results for each document
- For each document:
  - Document name and type
  - Checklist items with:
    - ✅ Green checkmark for passed items
    - ❌ Red X for failed items
    - Loading spinner during verification
    - Item label and optional failure reason
  - Overall status (Verified/Not Verified)
- Progressive display (items appear one by one with animation)
- "Download Report" button
- "Verify More Documents" button

#### 3. API Service Updates
**File:** `frontend/src/services/apiService.ts` (UPDATE)
Add:
- `verifyDocuments(documents: Array<{file: File, documentType: string}>)` method

#### 4. Type Definitions
**File:** `frontend/src/types/index.ts` (UPDATE)
Add verification-related types matching backend

#### 5. App Navigation
**File:** `frontend/src/App.tsx` (UPDATE)
- Add navigation/tabs to switch between:
  - "Document Extraction" (existing)
  - "Document Verification" (new)
- Or add verification as a document type option

## Implementation Details

### LLM Prompt Structure
Each verification prompt will:
1. Describe the document type
2. List all 5 checklist items with descriptions
3. Request JSON response with structure:
```json
{
  "verification": {
    "format_layout": {
      "passed": true,
      "reason": "Document shows correct Austrian passport design with red cover"
    },
    "passport_number": {
      "passed": true,
      "reason": "Passport number found: A1234567"
    },
    // ... more items
  },
  "overallStatus": "verified",
  "confidence": 0.95
}
```

### Verification Flow
1. User selects document type for each upload field
2. User uploads files to respective fields
3. User clicks "Verify Documents"
4. For each document:
   - Extract text from file
   - Send to LLM with verification prompt
   - Parse verification results
   - Update UI progressively (show items as they're verified)
5. Display final results with overall status

### Error Handling
- Invalid file format → Show error for specific document
- LLM verification failure → Show partial results if available
- Network errors → Retry mechanism
- Document type mismatch → Clear error message

### UI/UX Considerations
- Progressive disclosure: Show checklist items as they're verified
- Clear visual feedback: Green checks, red X's
- Loading states: Spinner while verifying
- Disabled states: Disable verify button until all documents uploaded
- Responsive design: Works on mobile and desktop

## File Structure Summary

### New Files
```
backend/
  src/
    config/
      verificationChecklists.json
      prompts/
        austrian_passport_verification_prompt.txt
        austrian_id_card_verification_prompt.txt
        real_estate_contract_verification_prompt.txt
    services/
      verificationService.ts
    routes/
      verify.ts

frontend/
  src/
    components/
      DocumentVerificationPage.tsx
      VerificationDisplay.tsx
```

### Modified Files
```
backend/
  src/
    config/
      documentTypes.json
    types/
      index.ts
    server.ts

frontend/
  src/
    App.tsx
    services/
      apiService.ts
    types/
      index.ts
```

## Testing Strategy
1. Unit tests for verification service logic
2. Integration tests for verification endpoint
3. E2E tests for verification workflow
4. Test with valid and invalid documents
5. Test error scenarios (missing files, wrong types, etc.)

## Future Enhancements
- Add more document types
- Allow custom checklist items
- Save verification history
- Export verification reports
- Batch verification of multiple sets

