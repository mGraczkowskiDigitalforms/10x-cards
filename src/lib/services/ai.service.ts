import type { FlashcardProposalDto } from '../../types';

// Mock API service response
const mockApiResponse = [
  {
    front: "What is the capital of France?",
    back: "Paris",
    source: "ai-full"
  },
  {
    front: "What is the largest planet in our solar system?",
    back: "Jupiter",
    source: "ai-full"
  },
  {
    front: "Who wrote 'Romeo and Juliet'?",
    back: "William Shakespeare",
    source: "ai-full"
  }
] as const;

export class AiService {
  private readonly timeoutMs: number = 10000;

  async generateFlashcards(text: string): Promise<FlashcardProposalDto[]> {
    // Simulate potential timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject({
          code: 'TIMEOUT' as const,
          message: `AI service request timed out after ${this.timeoutMs}ms`
        });
      }, this.timeoutMs);
    });

    // Mock API call with delay
    const apiCallPromise = new Promise<FlashcardProposalDto[]>(async (resolve) => {
      await new Promise(r => setTimeout(r, 1000));
      resolve([...mockApiResponse]);
    });

    // Race between timeout and API call
    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    
    // Validate response structure
    this.validateResponse(result);

    return result;
  }

  private validateResponse(response: unknown): asserts response is FlashcardProposalDto[] {
    if (!Array.isArray(response)) {
      throw {
        code: 'INVALID_RESPONSE' as const,
        message: 'AI service response is not an array'
      };
    }

    const isValidResponse = response.every(card => 
      typeof card === 'object' &&
      card !== null &&
      typeof (card as any).front === 'string' && 
      typeof (card as any).back === 'string' && 
      (card as any).source === 'ai-full'
    );

    if (!isValidResponse) {
      throw {
        code: 'INVALID_RESPONSE' as const,
        message: 'AI service returned invalid flashcard structure'
      };
    }
  }
} 