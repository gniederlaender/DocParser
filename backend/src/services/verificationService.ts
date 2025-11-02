import * as fs from 'fs';
import * as path from 'path';
import { 
  VerificationChecklist, 
  VerificationChecklistItem, 
  VerificationResult,
  VerificationItemResult 
} from '../types';
import { llmService } from './llmService';
import { fileService } from './fileService';

export class VerificationService {
  private checklists: { [key: string]: VerificationChecklist } = {};
  private readonly checklistsPath: string;
  private readonly promptsPath: string;

  constructor() {
    this.checklistsPath = path.join(__dirname, '../../src/config/verificationChecklists.json');
    this.promptsPath = path.join(__dirname, '../../src/config/prompts');
    this.loadChecklists();
  }

  private loadChecklists(): void {
    try {
      if (fs.existsSync(this.checklistsPath)) {
        const checklistsData = fs.readFileSync(this.checklistsPath, 'utf-8');
        const parsed = JSON.parse(checklistsData);
        this.checklists = parsed;
      } else {
        console.error('Verification checklists file not found:', this.checklistsPath);
      }
    } catch (error) {
      console.error('Error loading verification checklists:', error);
    }
  }

  public getChecklist(documentType: string): VerificationChecklist | null {
    return this.checklists[documentType] || null;
  }

  public getSupportedDocumentTypes(): string[] {
    return Object.keys(this.checklists);
  }

  public getPromptTemplate(documentType: string): string | null {
    const promptFileName = `${documentType}_verification_prompt.txt`;
    const promptPath = path.join(this.promptsPath, promptFileName);
    
    try {
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, 'utf-8');
      } else {
        console.error(`Verification prompt not found for ${documentType}: ${promptPath}`);
        return null;
      }
    } catch (error) {
      console.error(`Error reading verification prompt for ${documentType}:`, error);
      return null;
    }
  }

  public async verifyDocument(
    file: Express.Multer.File,
    documentType: string
  ): Promise<VerificationResult> {
    const startTime = Date.now();

    // Get checklist for this document type
    const checklist = this.getChecklist(documentType);
    if (!checklist) {
      throw new Error(`No checklist found for document type: ${documentType}`);
    }

    // Get prompt template
    const promptTemplate = this.getPromptTemplate(documentType);
    if (!promptTemplate) {
      throw new Error(`No prompt template found for document type: ${documentType}`);
    }

    // Save file temporarily
    const fileName = await fileService.saveFile(file, documentType);
    
    try {
      // Extract text from file
      const documentText = await fileService.extractTextFromFile(fileName);

      // Process with LLM
      const llmResponse = await llmService.getInstance().processDocument(
        documentText,
        promptTemplate,
        documentType
      );

      if (!llmResponse.success || !llmResponse.data) {
        throw new Error('Failed to process document with LLM');
      }

      // Validate and parse LLM response
      const validation = llmService.getInstance().validateLLMResponse(llmResponse.data);
      if (!validation.isValid || !validation.parsedData) {
        throw new Error(`Invalid LLM response: ${validation.error || 'Unknown error'}`);
      }

      // Parse verification results
      const verificationData = this.parseVerificationResponse(
        validation.parsedData,
        checklist,
        documentType
      );

      const processingTime = Date.now() - startTime;

      // Build checklist results matching the expected format
      const checklistResults = checklist.items.map(item => {
        const verificationItem = verificationData.verification[item.id];
        return {
          id: item.id,
          label: item.label,
          passed: verificationItem?.passed || false,
          reason: verificationItem?.reason || 'Not checked'
        };
      });

      const passedCount = checklistResults.filter(item => item.passed).length;
      const totalCount = checklistResults.length;
      const verified = passedCount === totalCount;

      return {
        documentType,
        fileName: file.originalname,
        verified,
        checklist: checklistResults,
        passedCount,
        totalCount,
        processingTime,
        confidence: verificationData.confidence || 0.95
      };

    } finally {
      // Clean up temporary file
      try {
        await fileService.deleteFile(fileName);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }
    }
  }

  private parseVerificationResponse(
    parsedData: any,
    checklist: VerificationChecklist,
    documentType: string
  ): { verification: { [key: string]: VerificationItemResult }; confidence?: number } {
    // The LLM should return data in format:
    // {
    //   verification: {
    //     item_id: { passed: true/false, reason: "..." }
    //   },
    //   overallStatus: "verified",
    //   confidence: 0.95
    // }

    if (!parsedData.verification || typeof parsedData.verification !== 'object') {
      // Fallback: create default failed results for all items
      const defaultVerification: { [key: string]: VerificationItemResult } = {};
      checklist.items.forEach(item => {
        defaultVerification[item.id] = {
          passed: false,
          reason: 'Verification data not found in LLM response'
        };
      });
      return { verification: defaultVerification };
    }

    const verification: { [key: string]: VerificationItemResult } = {};
    
    // Process each checklist item
    checklist.items.forEach(item => {
      const itemData = parsedData.verification[item.id];
      if (itemData && typeof itemData === 'object') {
        verification[item.id] = {
          passed: Boolean(itemData.passed),
          reason: String(itemData.reason || 'No reason provided')
        };
      } else {
        // Item not found in response, mark as failed
        verification[item.id] = {
          passed: false,
          reason: 'Item not found in verification response'
        };
      }
    });

    return {
      verification,
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : undefined
    };
  }
}

// Export singleton instance
export const verificationService = new VerificationService();

