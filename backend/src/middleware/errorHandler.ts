import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../types';

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;

  constructor(message: string, code: ErrorCode, statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = ErrorCode.NETWORK_ERROR;
  let message = 'Internal server error';

  // Handle custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  }
  // Handle multer errors
  else if (error.name === 'MulterError') {
    statusCode = 400;
    code = ErrorCode.VALIDATION_ERROR;
    if (error.message.includes('File too large')) {
      code = ErrorCode.FILE_TOO_LARGE;
      message = 'File size exceeds the maximum limit';
    } else if (error.message.includes('Unexpected field')) {
      message = 'Invalid file upload field';
    } else {
      message = 'File upload error: ' + error.message;
    }
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed: ' + error.message;
  }
  // Handle other known errors
  else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    code = ErrorCode.NETWORK_ERROR;
    message = 'Service temporarily unavailable';
  }

  // Log the error
  console.error(`[${new Date().toISOString()}] Error ${statusCode}: ${error.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.stack);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    }
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
