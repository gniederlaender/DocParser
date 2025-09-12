import express, { Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { documentTypeService } from '../services/documentTypeService';
import { fileService } from '../services/fileService';
import { llmService } from '../services/llmService';
import { UploadResponse, ComparisonResponse, ErrorCode, LoanOfferData, ComparisonData } from '../types';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Basic validation - more thorough validation happens in the service
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type', ErrorCode.INVALID_FILE_TYPE, 400));
    }
  }
});

// Configure multer for multiple files
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 3 // Maximum 3 files for comparison
  },
  fileFilter: (req, file, cb) => {
    // Basic validation - more thorough validation happens in the service
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type', ErrorCode.INVALID_FILE_TYPE, 400));
    }
  }
});

// POST /api/upload - Upload and process document
router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Validate request
  if (!req.file) {
    throw new AppError('No file uploaded', ErrorCode.VALIDATION_ERROR, 400);
  }

  const { documentType } = req.body;
  if (!documentType) {
    throw new AppError('Document type is required', ErrorCode.VALIDATION_ERROR, 400);
  }

  // Validate document type
  if (!documentTypeService.validateDocumentType(documentType)) {
    throw new AppError('Unsupported document type', ErrorCode.UNSUPPORTED_DOCUMENT_TYPE, 400);
  }

  // Validate file for document type
  const fileValidation = documentTypeService.validateFileForDocumentType(req.file, documentType);
  if (!fileValidation.isValid) {
    throw new AppError(fileValidation.error!, ErrorCode.VALIDATION_ERROR, 400);
  }

  try {
    console.log(`📄 Processing ${documentType} document: ${req.file.originalname} (${req.file.size} bytes)`);

    // Save file temporarily
    const fileName = await fileService.saveFile(req.file, documentType);
    console.log(`💾 File saved temporarily as: ${fileName}`);

    // Extract text from file (now using real extraction libraries)
    console.log('🔍 Extracting text from document...');
    const documentText = await fileService.extractTextFromFile(fileName);
    console.log(`📝 Extracted text length: ${documentText.length} characters`);

    // Get prompt template
    const promptTemplate = documentTypeService.getPromptTemplate(documentType);
    if (!promptTemplate) {
      console.error(`❌ No prompt template found for document type: ${documentType}`);
      throw new AppError('Prompt template not found for document type', ErrorCode.LLM_SERVICE_ERROR, 500);
    }
    console.log(`📋 Using prompt template for ${documentType}`);

    // Process with LLM
    console.log('🤖 Sending document to LLM for processing...');
    const llmResponse = await llmService.getInstance().processDocument(documentText, promptTemplate, documentType);

    if (!llmResponse.success || !llmResponse.data) {
      console.error('❌ LLM processing failed:', llmResponse.error || 'Unknown error');
      throw new AppError('Failed to process document with LLM', ErrorCode.LLM_SERVICE_ERROR, 500);
    }
    console.log('✅ LLM processing completed successfully');

    // Validate and parse LLM response
    console.log('🔍 Validating LLM response...');
    const validation = llmService.getInstance().validateLLMResponse(llmResponse.data);
    if (!validation.isValid) {
      console.error('❌ Invalid LLM response format:', validation.error);
      console.error('Raw LLM response:', llmResponse.data);
      throw new AppError(`Invalid LLM response: ${validation.error}`, ErrorCode.INVALID_RESPONSE_FORMAT, 500);
    }

    // Calculate confidence score
    const confidence = llmService.getInstance().calculateConfidence(validation.parsedData, documentType);
    const processingTime = Date.now() - startTime;
    
    console.log(`📊 Processing completed - Confidence: ${(confidence * 100).toFixed(1)}%, Time: ${processingTime}ms`);

    // Clean up temporary file
    try {
      await fileService.deleteFile(fileName);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError);
    }

    const response: UploadResponse = {
      success: true,
      data: {
        extractedData: validation.parsedData,
        documentType,
        processingTime,
        confidence
      }
    };

    console.log(`Document processing completed: ${documentType} (${processingTime}ms, confidence: ${confidence.toFixed(2)})`);

    res.json(response);

  } catch (error) {
    console.error(`❌ Document processing failed for ${documentType}:`, error);
    
    // Clean up file if it was saved
    if (req.file && req.file.originalname) {
      try {
        // Note: In a real implementation, you'd track the saved filename
        // For now, we'll rely on the cleanup job
      } catch (cleanupError) {
        console.warn('Failed to cleanup file after error:', cleanupError);
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error('Unexpected error during upload processing:', error);
    throw new AppError('Document processing failed', ErrorCode.PROCESSING_TIMEOUT, 500);
  }
}));

// POST /api/upload/compare - Upload and compare multiple documents
router.post('/upload/compare', uploadMultiple.array('files', 3), asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Validate request
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('No files uploaded', ErrorCode.VALIDATION_ERROR, 400);
  }

  const { documentType } = req.body;
  if (!documentType) {
    throw new AppError('Document type is required', ErrorCode.VALIDATION_ERROR, 400);
  }

  // Validate document type
  if (!documentTypeService.validateDocumentType(documentType)) {
    throw new AppError('Unsupported document type', ErrorCode.UNSUPPORTED_DOCUMENT_TYPE, 400);
  }

  // Check if document type supports comparison
  const docType = documentTypeService.getDocumentType(documentType);
  if (!docType || !docType.maxFiles || !docType.minFiles) {
    throw new AppError('Document type does not support comparison', ErrorCode.UNSUPPORTED_DOCUMENT_TYPE, 400);
  }

  // Validate file count
  if (req.files.length < docType.minFiles || req.files.length > docType.maxFiles) {
    throw new AppError(`Document type requires between ${docType.minFiles} and ${docType.maxFiles} files`, ErrorCode.VALIDATION_ERROR, 400);
  }

  // Validate each file
  for (const file of req.files) {
    const fileValidation = documentTypeService.validateFileForDocumentType(file, documentType);
    if (!fileValidation.isValid) {
      throw new AppError(`File validation failed: ${fileValidation.error}`, ErrorCode.VALIDATION_ERROR, 400);
    }
  }

  try {
    console.log(`📄 Processing ${req.files.length} ${documentType} documents for comparison`);

    const individualOffers: LoanOfferData[] = [];
    const savedFileNames: string[] = [];

    // Process each file individually
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`📄 Processing document ${i + 1}/${req.files.length}: ${file.originalname}`);

      // Save file temporarily
      const fileName = await fileService.saveFile(file, documentType);
      savedFileNames.push(fileName);
      console.log(`💾 File saved temporarily as: ${fileName}`);

      // Extract text from file
      console.log('🔍 Extracting text from document...');
      const documentText = await fileService.extractTextFromFile(fileName);
      console.log(`📝 Extracted text length: ${documentText.length} characters`);

      // Get prompt template for individual extraction
      const promptTemplate = documentTypeService.getPromptTemplate(documentType);
      if (!promptTemplate) {
        throw new AppError('Prompt template not found for document type', ErrorCode.LLM_SERVICE_ERROR, 500);
      }

      // Process with LLM
      console.log('🤖 Sending document to LLM for processing...');
      const llmResponse = await llmService.getInstance().processDocument(documentText, promptTemplate, documentType);

      if (!llmResponse.success || !llmResponse.data) {
        throw new AppError('Failed to process document with LLM', ErrorCode.LLM_SERVICE_ERROR, 500);
      }

      // Validate and parse LLM response
      const validation = llmService.getInstance().validateLLMResponse(llmResponse.data);
      if (!validation.isValid) {
        throw new AppError(`Invalid LLM response: ${validation.error}`, ErrorCode.INVALID_RESPONSE_FORMAT, 500);
      }

      // Add file name to the extracted data
      const offerData: LoanOfferData = {
        ...validation.parsedData,
        fileName: file.originalname
      };

      individualOffers.push(offerData);
      console.log(`✅ Document ${i + 1} processed successfully`);
    }

    // Now create comparison using all extracted data
    console.log('🔄 Creating comparison analysis...');
    
    // Read the comparison prompt directly from file
    const comparisonPromptPath = path.join(__dirname, '../config/prompts/angebotsvergleich_comparison_prompt.txt');
    
    let comparisonPrompt: string;
    try {
      comparisonPrompt = fs.readFileSync(comparisonPromptPath, 'utf-8');
    } catch (error) {
      console.error('Failed to read comparison prompt file:', error);
      throw new AppError('Comparison prompt template not found', ErrorCode.LLM_SERVICE_ERROR, 500);
    }

    // Create combined text for comparison
    const combinedText = individualOffers.map((offer, index) => 
      `Angebot ${index + 1} (${offer.fileName}):\n${JSON.stringify(offer, null, 2)}`
    ).join('\n\n');

    // Process comparison with LLM
    const comparisonResponse = await llmService.getInstance().processDocument(combinedText, comparisonPrompt, 'angebotsvergleich_comparison');

    if (!comparisonResponse.success || !comparisonResponse.data) {
      throw new AppError('Failed to create comparison with LLM', ErrorCode.LLM_SERVICE_ERROR, 500);
    }

    // Validate comparison response
    const comparisonValidation = llmService.getInstance().validateLLMResponse(comparisonResponse.data);
    if (!comparisonValidation.isValid) {
      throw new AppError(`Invalid comparison response: ${comparisonValidation.error}`, ErrorCode.INVALID_RESPONSE_FORMAT, 500);
    }

    const processingTime = Date.now() - startTime;
    console.log(`📊 Comparison completed - Time: ${processingTime}ms`);

    // Clean up temporary files
    for (const fileName of savedFileNames) {
      try {
        await fileService.deleteFile(fileName);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }
    }

    const response: ComparisonResponse = {
      success: true,
      data: {
        individualOffers,
        comparison: comparisonValidation.parsedData,
        documentType,
        processingTime,
        confidence: 0.95 // High confidence for comparison
      }
    };

    console.log(`Document comparison completed: ${documentType} (${processingTime}ms)`);
    res.json(response);

  } catch (error) {
    console.error(`❌ Document comparison failed for ${documentType}:`, error);
    
    // Clean up files if they were saved
    if (req.files && Array.isArray(req.files)) {
      try {
        // Note: In a real implementation, you'd track the saved filenames
        // For now, we'll rely on the cleanup job
      } catch (cleanupError) {
        console.warn('Failed to cleanup files after error:', cleanupError);
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error('Unexpected error during comparison processing:', error);
    throw new AppError('Document comparison failed', ErrorCode.PROCESSING_TIMEOUT, 500);
  }
}));

// GET /api/upload/stats - Get upload statistics
router.get('/upload/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = fileService.getFileStats();

  res.json({
    success: true,
    data: {
      ...stats,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      supportedFormats: ['pdf', 'png', 'jpg', 'jpeg', 'docx']
    }
  });
}));

export default router;
