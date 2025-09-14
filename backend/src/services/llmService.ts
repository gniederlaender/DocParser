import OpenAI from 'openai';
import { LLMResponse, ErrorCode } from '../types';
import { AppError } from '../middleware/errorHandler';

export class LLMService {
  private client: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    this.model = process.env.LLM_MODEL || 'gpt-4o';
    this.maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '10000');
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.1');
  }

  public async processDocument(
    documentText: string,
    promptTemplate: string,
    documentType: string
  ): Promise<LLMResponse> {
    try {
      const startTime = Date.now();

      // Prepare the prompt
      const fullPrompt = this.buildPrompt(promptTemplate, documentText);

      // Call OpenAI API
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional document parsing assistant. Always return valid JSON when extracting data from documents. If you cannot find specific information, use null for required fields and omit optional fields.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      const processingTime = Date.now() - startTime;
      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new AppError('No response received from LLM service', ErrorCode.LLM_SERVICE_ERROR, 502);
      }

      console.log(`LLM processing completed in ${processingTime}ms for ${documentType}`);

      return {
        success: true,
        data: response
      };

    } catch (error: any) {
      console.error('LLM Service Error:', error);

      // Handle specific OpenAI errors
      if (error.status === 401) {
        throw new AppError('Invalid API key', ErrorCode.LLM_SERVICE_ERROR, 500);
      } else if (error.status === 429) {
        throw new AppError('Rate limit exceeded. Please try again later.', ErrorCode.LLM_SERVICE_ERROR, 429);
      } else if (error.status === 400) {
        throw new AppError('Invalid request to LLM service', ErrorCode.LLM_SERVICE_ERROR, 400);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new AppError('Unable to connect to LLM service', ErrorCode.NETWORK_ERROR, 503);
      }

      // Generic error
      throw new AppError(
        `LLM processing failed: ${error.message || 'Unknown error'}`,
        ErrorCode.LLM_SERVICE_ERROR,
        500
      );
    }
  }

  private buildPrompt(promptTemplate: string, documentText: string): string {
    // Replace placeholders in the template
    let prompt = promptTemplate.replace('{DOCUMENT_TEXT}', documentText);
    prompt = prompt.replace('{DOCUMENT_CONTENT}', documentText);

    // Add document text if not already included
    if (!prompt.includes(documentText)) {
      prompt += `\n\nDocument Content:\n${documentText}`;
    }

    return prompt;
  }

  public validateLLMResponse(response: string): { isValid: boolean; parsedData?: any; error?: string } {
    try {
      // Clean the response by removing markdown code blocks if present
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks (```json and ```)
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
      cleanedResponse = cleanedResponse.trim();

      // Extract only the JSON part if there's additional text after the JSON
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      console.log('🧹 Cleaned LLM response for JSON parsing...');
      
      const parsed = JSON.parse(cleanedResponse);

      // Basic validation - ensure it's an object
      if (typeof parsed !== 'object' || parsed === null) {
        return {
          isValid: false,
          error: 'Response is not a valid JSON object'
        };
      }

      console.log('✅ Successfully parsed JSON response');
      return {
        isValid: true,
        parsedData: parsed
      };
    } catch (error) {
      console.error('❌ JSON parsing failed:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Raw response:', response.substring(0, 200) + '...');
      return {
        isValid: false,
        error: `Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public calculateConfidence(extractedData: any, documentType: string): number {
    // Simple confidence calculation based on field completeness
    let score = 0;
    let totalFields = 0;

    if (documentType === 'kaufvertrag') {
      const required = ['buyer', 'seller', 'object', 'price'];
      totalFields = required.length;
      score = required.filter(field => extractedData[field] != null).length;
    } else if (documentType === 'invoice') {
      const required = ['vendorName', 'invoiceNumber', 'invoiceDate', 'totalAmount'];
      totalFields = required.length;
      score = required.filter(field => extractedData[field] != null).length;
    } else if (documentType === 'receipt') {
      const required = ['merchantName', 'transactionDate', 'totalAmount'];
      totalFields = required.length;
      score = required.filter(field => extractedData[field] != null).length;
    } else if (documentType === 'business_card') {
      const required = ['name'];
      totalFields = required.length;
      score = required.filter(field => extractedData[field] != null).length;
    } else if (documentType === 'resume') {
      const required = ['personalInfo'];
      totalFields = required.length;
      score = required.filter(field => extractedData[field] != null).length;
    }

    // Add bonus for optional fields
    const optionalFields = Object.keys(extractedData).filter(key =>
      !['buyer', 'seller', 'object', 'price', 'vendorName', 'invoiceNumber', 'invoiceDate', 'totalAmount',
        'merchantName', 'transactionDate', 'name', 'personalInfo'].includes(key)
    );
    score += Math.min(optionalFields.length * 0.5, totalFields * 0.5);

    return Math.min(Math.max(score / totalFields, 0), 1);
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.models.list();
      return response.data.length > 0;
    } catch (error) {
      console.error('LLM Service connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance (lazy initialization)
let llmServiceInstance: LLMService | null = null;

export const llmService = {
  getInstance(): LLMService {
    if (!llmServiceInstance) {
      llmServiceInstance = new LLMService();
    }
    return llmServiceInstance;
  }
};
