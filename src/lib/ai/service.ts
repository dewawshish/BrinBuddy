/**
 * BrainBuddy AI Service
 * Main service layer for all AI operations
 */

import {
  AIServiceConfig,
  AINotesRequest,
  AIDoubtsRequest,
  AIGuidanceRequest,
  AIContext,
  AINotesStructure,
  AIResponse,
} from '@/types/ai';
import { buildNotesPrompt, buildDoubtsPrompt, buildGuidancePrompt } from './promptTemplates';
import { parseNotesResponse, validateAIResponse } from './responseFormatter';

class BrainBuddyAIService {
  private config: AIServiceConfig;
  private chatHistory: Map<string, any[]> = new Map();

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Generate notes for a given topic
   */
  async generateNotes(request: AINotesRequest): Promise<AIResponse & { data?: AINotesStructure }> {
    try {
      const prompt = buildNotesPrompt(request);
      const response = await this.callAIModel(prompt);

      const validation = validateAIResponse(response);
      if (!validation.valid) {
        return { success: false, error: validation.error, timestamp: Date.now() };
      }

      const notes = parseNotesResponse(response);

      // Store in chat history for context
      this.addToHistory(request.context.userId, {
        type: 'notes',
        topic: request.topic,
        timestamp: Date.now(),
      });

      return {
        success: true,
        data: notes,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error generating notes:', error);
      return {
        success: false,
        error: 'Failed to generate notes. Please try again.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Answer student doubts
   */
  async solveDoubt(request: AIDoubtsRequest): Promise<AIResponse> {
    try {
      const prompt = buildDoubtsPrompt(request.doubt, request.subject, request.context.preferences);
      const response = await this.callAIModel(prompt);

      const validation = validateAIResponse(response);
      if (!validation.valid) {
        return { success: false, error: validation.error, timestamp: Date.now() };
      }

      this.addToHistory(request.context.userId, {
        type: 'doubt',
        doubt: request.doubt,
        subject: request.subject,
        timestamp: Date.now(),
      });

      return {
        success: true,
        data: { response },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error solving doubt:', error);
      return {
        success: false,
        error: 'Failed to answer the doubt. Please try again.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Provide study guidance
   */
  async provideGuidance(request: AIGuidanceRequest): Promise<AIResponse> {
    try {
      const prompt = buildGuidancePrompt(request.goal, request.context);
      const response = await this.callAIModel(prompt);

      const validation = validateAIResponse(response);
      if (!validation.valid) {
        return { success: false, error: validation.error, timestamp: Date.now() };
      }

      this.addToHistory(request.context.userId, {
        type: 'guidance',
        goal: request.goal,
        exam: request.examName,
        timestamp: Date.now(),
      });

      return {
        success: true,
        data: { response },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error providing guidance:', error);
      return {
        success: false,
        error: 'Failed to provide guidance. Please try again.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Send chat message and get response
   */
  async chat(userId: string, message: string, context?: AIContext): Promise<AIResponse> {
    try {
      // Check rate limiting
      if (!this.isRateLimited(userId)) {
        return {
          success: false,
          error: 'Too many requests. Please wait a moment.',
          timestamp: Date.now(),
        };
      }

      const systemPrompt = `You are BrainBuddy, an AI tutor helping students learn better. 
Be friendly, encouraging, and concise. 
${context ? `Student: ${context.userName}, Level: ${context.preferences.difficultyLevel}` : ''}`;

      const response = await this.callAIModel(`${systemPrompt}\n\nStudent: ${message}`);

      const validation = validateAIResponse(response);
      if (!validation.valid) {
        return { success: false, error: validation.error, timestamp: Date.now() };
      }

      this.addToHistory(userId, { type: 'chat', message, timestamp: Date.now() });

      return {
        success: true,
        data: { response },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error in chat:', error);
      return {
        success: false,
        error: 'Failed to process message. Please try again.',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Call AI model (mock implementation, can be extended for real APIs)
   * In production, this would call OpenAI, Bytez, Groq, or a local model
   */
  private async callAIModel(prompt: string): Promise<string> {
    // Mock response for now - in production, integrate with real AI APIs
    // This is designed to simulate AI responses for testing

    // For development, we'll return well-formatted mock responses
    return this.generateMockResponse(prompt);
  }

  /**
   * Generate mock AI response (for development)
   * Replace this with actual API calls in production
   */
  private generateMockResponse(prompt: string): string {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Detect what type of request this is
        if (prompt.includes('Quick Overview')) {
          // Notes generation response
          const mockNotes = `## Quick Overview
This is a fundamental concept that builds the foundation for advanced learning in this subject.

## Key Concepts
- Concept 1: The basic building block
- Concept 2: How they interact
- Concept 3: Why it matters

## Detailed Explanation
The detailed explanation provides comprehensive coverage of the topic. It explains the mechanisms, processes, and relationships involved in a clear, structured manner.

## Examples & Applications
Real-world example: This concept is used in practical scenarios like...
Exam example: A common question tests understanding of...

## Formulas & Rules
Key formula: F = ma
Application rule: Always check units before solving
Quick tip: Remember this relationship for tests

## Exam Tips & Common Mistakes
- Tip 1: Always verify your answer by substituting back
- Tip 2: Watch the units - they're often a source of mistakes
- Common Mistake: Students often forget to...

## Quick Revision Box
- Main idea: One sentence summary
- Key formula: The essential equation
- Remember: The most important concept`;
          resolve(mockNotes);
        } else if (prompt.includes('Student Question') || prompt.includes('Student: ')) {
          // Doubt solving or chat response
          const mockDoubtResponse = `I understand your question! Let me break it down for you.

The key concept here is... which works like this:
1. First, you need to understand that...
2. Then, consider how...
3. Finally, apply it like this...

A practical example: If we look at [real situation], we can see...

Remember: The most important thing is to focus on the fundamental principle. Once you grasp that, everything else clicks into place!

Is there any specific part you'd like me to explain further?`;
          resolve(mockDoubtResponse);
        } else if (prompt.includes('Study plan')) {
          // Guidance response
          const mockGuidanceResponse = `Great question! Here's your personalized study plan:

## Your Study Plan
1. **Foundation Phase (Week 1-2)**
   - Core concepts and basics
   - Build strong understanding

2. **Application Phase (Week 3-4)**
   - Practice problems
   - Real-world scenarios

3. **Mastery Phase (Week 5-6)**
   - Advanced topics
   - Mock tests

## Time Allocation
- Theory: 40%
- Practice: 40%
- Revision: 20%

## Key Topics to Focus On
- Topic 1 (High Priority)
- Topic 2 (Medium Priority)
- Topic 3 (Reference)

## Tips for Success
- Practice regularly
- Group similar problems
- Teach others (best way to learn)
- Take mock tests

You've got this! Start with the fundamentals and build up.`;
          resolve(mockGuidanceResponse);
        } else {
          resolve(`I'm here to help! This is a mock response. In production, I'll provide AI-powered assistance using real language models.`);
        }
      }, 800); // Simulate API latency
    }) as Promise<string>;
  }

  /**
   * Rate limiting check
   */
  private isRateLimited(userId: string): boolean {
    // Simple rate limiting: max 30 requests per minute
    const history = this.chatHistory.get(userId) || [];
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = history.filter((h) => h.timestamp > oneMinuteAgo).length;

    return recentRequests < 30;
  }

  /**
   * Add to chat history
   */
  private addToHistory(userId: string, entry: any): void {
    if (!this.chatHistory.has(userId)) {
      this.chatHistory.set(userId, []);
    }

    const history = this.chatHistory.get(userId)!;
    history.push(entry);

    // Keep only last 100 entries per user
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get chat history
   */
  getHistory(userId: string): any[] {
    return this.chatHistory.get(userId) || [];
  }

  /**
   * Clear history for user
   */
  clearHistory(userId: string): void {
    this.chatHistory.delete(userId);
  }
}

// Singleton instance
let aiService: BrainBuddyAIService | null = null;

/**
 * Get or create AI service instance
 */
export const getAIService = (
  config: AIServiceConfig = {
    model: 'openai',
    maxRetries: 3,
    timeout: 30000,
  }
): BrainBuddyAIService => {
  if (!aiService) {
    aiService = new BrainBuddyAIService(config);
  }
  return aiService;
};

export default getAIService;
