import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { documentTypeService } from '../services/documentTypeService';
import { DocumentTypesResponse } from '../types';

const router = express.Router();

// GET /api/document-types - Get all available document types
router.get('/document-types', asyncHandler(async (req, res) => {
  const documentTypes = documentTypeService.getAllDocumentTypes();

  const response: DocumentTypesResponse = {
    success: true,
    data: documentTypes
  };

  res.json(response);
}));

// GET /api/document-types/:id - Get specific document type
router.get('/document-types/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const documentType = documentTypeService.getDocumentTypeById(id);

  if (!documentType) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Document type '${id}' not found`
      }
    });
    return;
  }

  res.json({
    success: true,
    data: documentType
  });
}));

// POST /api/document-types - Add new document type (admin only)
router.post('/document-types', asyncHandler(async (req, res) => {
  const { id, name, description, supportedFormats, maxFileSize, promptTemplate } = req.body;

  // Basic validation
  if (!id || !name || !description) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: id, name, description'
      }
    });
    return;
  }

  try {
    documentTypeService.addDocumentType({
      id,
      name,
      description,
      supportedFormats: supportedFormats || ['pdf', 'png', 'jpg', 'jpeg'],
      maxFileSize: maxFileSize || 10 * 1024 * 1024, // 10MB default
      promptTemplate: promptTemplate || `${id}_prompt.txt`
    });

    res.status(201).json({
      success: true,
      message: `Document type '${name}' added successfully`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
}));

// PUT /api/document-types/:id - Update document type (admin only)
router.put('/document-types/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    documentTypeService.updateDocumentType(id, updates);

    res.json({
      success: true,
      message: `Document type '${id}' updated successfully`
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
  }
}));

// DELETE /api/document-types/:id - Delete document type (admin only)
router.delete('/document-types/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    documentTypeService.deleteDocumentType(id);

    res.json({
      success: true,
      message: `Document type '${id}' deleted successfully`
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
  }
}));

export default router;
