import express, { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { documentTypeService } from '../services/documentTypeService';
import { fileService } from '../services/fileService';
import { llmService } from '../services/llmService';
import { UploadResponse, ErrorCode } from '../types';

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
