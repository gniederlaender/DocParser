import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode } from '../types';
import { AppError } from '../middleware/errorHandler';
import * as pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import * as mammoth from 'mammoth';

export class FileService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        console.log(`Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw new Error('Upload directory creation failed');
    }
  }

  public async saveFile(file: Express.Multer.File, documentType: string): Promise<string> {
    try {
      // Validate file size
      if (file.size > this.maxFileSize) {
        throw new AppError(
          `File size ${file.size} exceeds maximum limit of ${this.maxFileSize}`,
          ErrorCode.FILE_TOO_LARGE,
          413
        );
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}_${Date.now()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, uniqueName);

      // Write file to disk
      await fs.promises.writeFile(filePath, file.buffer);

      console.log(`File saved: ${filePath} (${file.size} bytes)`);

      return uniqueName;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('File save error:', error);
      throw new AppError('Failed to save uploaded file', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  public async readFile(fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, fileName);

      // Security check: ensure file is within upload directory
      const resolvedPath = path.resolve(filePath);
      const uploadDirResolved = path.resolve(this.uploadDir);

      if (!resolvedPath.startsWith(uploadDirResolved)) {
        throw new AppError('Invalid file path', ErrorCode.VALIDATION_ERROR, 400);
      }

      if (!fs.existsSync(filePath)) {
        throw new AppError('File not found', ErrorCode.VALIDATION_ERROR, 404);
      }

      return await fs.promises.readFile(filePath);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('File read error:', error);
      throw new AppError('Failed to read file', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  public async extractTextFromFile(fileName: string): Promise<string> {
    try {
      const fileBuffer = await this.readFile(fileName);
      const fileExtension = path.extname(fileName).toLowerCase();

      console.log(`🔍 Extracting text from ${fileExtension} file: ${fileName}`);

      if (fileExtension === '.pdf') {
        return await this.extractTextFromPDF(fileBuffer);
      } else if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
        return await this.extractTextFromImage(fileBuffer);
      } else if (fileExtension === '.docx') {
        return await this.extractTextFromDOCX(fileBuffer);
      } else {
        throw new AppError(`Unsupported file type: ${fileExtension}`, ErrorCode.INVALID_FILE_TYPE, 400);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Text extraction error:', error);
      throw new AppError('Failed to extract text from file', ErrorCode.PROCESSING_TIMEOUT, 500);
    }
  }

  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      console.log('📖 Parsing PDF with pdf-parse library...');
      const pdfData = await pdfParse.default(fileBuffer);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new AppError('PDF contains no readable text', ErrorCode.PROCESSING_TIMEOUT, 400);
      }

      console.log(`✅ Extracted ${pdfData.text.length} characters from PDF`);
      console.log(`📄 PDF info: ${pdfData.numpages} pages, ${pdfData.numrender} pages rendered`);
      
      return pdfData.text.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to extract text from PDF', ErrorCode.PROCESSING_TIMEOUT, 500);
    }
  }

  private async extractTextFromImage(fileBuffer: Buffer): Promise<string> {
    let worker;
    try {
      console.log('🔍 Initializing OCR worker for image text extraction...');
      worker = await createWorker('deu+eng'); // Support German and English
      
      console.log('📸 Processing image with Tesseract OCR...');
      const { data: { text } } = await worker.recognize(fileBuffer);
      
      if (!text || text.trim().length === 0) {
        throw new AppError('No readable text found in image', ErrorCode.PROCESSING_TIMEOUT, 400);
      }

      console.log(`✅ Extracted ${text.length} characters from image via OCR`);
      return text.trim();
    } catch (error) {
      console.error('OCR extraction error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to extract text from image using OCR', ErrorCode.PROCESSING_TIMEOUT, 500);
    } finally {
      if (worker) {
        await worker.terminate();
        console.log('🔄 OCR worker terminated');
      }
    }
  }

  private async extractTextFromDOCX(fileBuffer: Buffer): Promise<string> {
    try {
      console.log('📝 Extracting text from DOCX with mammoth...');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new AppError('DOCX contains no readable text', ErrorCode.PROCESSING_TIMEOUT, 400);
      }

      // Log any conversion messages/warnings
      if (result.messages && result.messages.length > 0) {
        console.log('⚠️ DOCX conversion messages:', result.messages.map(m => m.message));
      }

      console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
      return result.value.trim();
    } catch (error) {
      console.error('DOCX extraction error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to extract text from DOCX', ErrorCode.PROCESSING_TIMEOUT, 500);
    }
  }

  public async deleteFile(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, fileName);

      // Security check
      const resolvedPath = path.resolve(filePath);
      const uploadDirResolved = path.resolve(this.uploadDir);

      if (!resolvedPath.startsWith(uploadDirResolved)) {
        throw new AppError('Invalid file path', ErrorCode.VALIDATION_ERROR, 400);
      }

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('File deletion error:', error);
      throw new AppError('Failed to delete file', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  public async cleanupOldFiles(maxAgeHours: number = 1): Promise<number> {
    try {
      const files = await fs.promises.readdir(this.uploadDir);
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.promises.stat(filePath);
        const fileAge = Date.now() - stats.mtime.getTime();

        if (fileAge > maxAgeMs) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old files`);
      }

      return deletedCount;
    } catch (error) {
      console.error('File cleanup error:', error);
      return 0;
    }
  }

  public getFileStats(): { totalFiles: number; totalSize: number } {
    try {
      const files = fs.readdirSync(this.uploadDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      return {
        totalFiles: files.length,
        totalSize
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
