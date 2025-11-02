import express, { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ErrorCode, VerificationResponse, VerificationResult } from '../types';
import { verificationService } from '../services/verificationService';
import { documentTypeService } from '../services/documentTypeService';

const router = express.Router();

// Configure multer for multiple files (up to 10 files for verification)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10 // Maximum 10 files for verification
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type', ErrorCode.INVALID_FILE_TYPE, 400));
    }
  }
});

// POST /api/verify - Verify multiple documents
router.post('/verify', upload.array('documents', 10), asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Validate request
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('No files uploaded', ErrorCode.VALIDATION_ERROR, 400);
  }

  // Parse document types from request body
  // Expect documentTypes as JSON string or array in form data
  // Files are sent in order, documentTypes should match that order
  let documentTypes: string[];
  
  if (req.body.documentTypes) {
    try {
      documentTypes = typeof req.body.documentTypes === 'string' 
        ? JSON.parse(req.body.documentTypes) 
        : req.body.documentTypes;
    } catch (error) {
      throw new AppError('Invalid document types format. Expected JSON array.', ErrorCode.VALIDATION_ERROR, 400);
    }
  } else {
    // Try alternative: individual documentType fields (documentType0, documentType1, etc.)
    documentTypes = [];
    for (let i = 0; i < req.files.length; i++) {
      const docType = req.body[`documentType${i}`] || req.body[`documentTypes[${i}]`];
      if (!docType) {
        throw new AppError(`Document type for file ${i + 1} is required`, ErrorCode.VALIDATION_ERROR, 400);
      }
      documentTypes.push(docType);
    }
  }

  if (!Array.isArray(documentTypes) || documentTypes.length !== req.files.length) {
    throw new AppError(
      `Number of document types (${documentTypes.length}) must match number of files (${req.files.length})`,
      ErrorCode.VALIDATION_ERROR,
      400
    );
  }

  // Validate that all document types are supported for verification
  const supportedTypes = verificationService.getSupportedDocumentTypes();
  for (const docType of documentTypes) {
    if (!supportedTypes.includes(docType)) {
      throw new AppError(
        `Unsupported document type for verification: ${docType}. Supported types: ${supportedTypes.join(', ')}`,
        ErrorCode.UNSUPPORTED_DOCUMENT_TYPE,
        400
      );
    }
  }

  // Validate each file for its corresponding document type
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const docType = documentTypes[i];
    
    // Basic validation: check file size and format
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '15728640'); // 15MB default
    if (file.size > maxSize) {
      throw new AppError(
        `File size exceeds maximum limit for ${file.originalname}`,
        ErrorCode.FILE_TOO_LARGE,
        400
      );
    }
    
    // Check file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new AppError(
        `Unsupported file format for ${file.originalname}. Supported: ${allowedExtensions.join(', ')}`,
        ErrorCode.INVALID_FILE_TYPE,
        400
      );
    }
  }

  try {
    console.log(`🔍 Starting verification of ${req.files.length} documents`);

    const verificationResults: VerificationResult[] = [];

    // Process each document
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const documentType = documentTypes[i];

      console.log(`📄 Verifying document ${i + 1}/${req.files.length}: ${file.originalname} (${documentType})`);

      try {
        const result = await verificationService.verifyDocument(file, documentType);
        verificationResults.push(result);
        
        const status = result.verified ? '✅ VERIFIED' : '❌ NOT VERIFIED';
        console.log(`   ${status} - ${result.passedCount}/${result.totalCount} items passed`);
      } catch (error: any) {
        console.error(`❌ Verification failed for ${file.originalname}:`, error);
        
        // Create a failed result
        const checklist = verificationService.getChecklist(documentType);
        const failedResult: VerificationResult = {
          documentType,
          fileName: file.originalname,
          verified: false,
          checklist: checklist?.items.map(item => ({
            id: item.id,
            label: item.label,
            passed: false,
            reason: error.message || 'Verification failed'
          })) || [],
          passedCount: 0,
          totalCount: checklist?.items.length || 0,
          processingTime: 0
        };
        verificationResults.push(failedResult);
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const overallVerified = verificationResults.every(result => result.verified);

    console.log(`📊 Verification completed - Overall: ${overallVerified ? 'VERIFIED' : 'NOT VERIFIED'} (${totalProcessingTime}ms)`);

    const response: VerificationResponse = {
      success: true,
      data: {
        documents: verificationResults,
        overallVerified,
        totalProcessingTime
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Verification process failed:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Document verification failed', ErrorCode.PROCESSING_TIMEOUT, 500);
  }
}));

export default router;

