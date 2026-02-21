/**
 * BrainBuddy AI Types and Interfaces
 */

export type AIModel = 'openai' | 'bytez' | 'groq' | 'local';
export type LearningStyle = 'quick' | 'detailed' | 'exam-focused';
export type UserRole = 'student' | 'teacher' | 'admin';
export type SubjectType = 'math' | 'science' | 'history' | 'geography' | 'cs' | 'literature' | 'other';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AINotesStructure {
  quickOverview: string;
  keyConcepts: string[];
  detailedExplanation: string;
  examplesApplications: string;
  formulasFactsRules?: string;
  examTipsTrap: string;
  quickRevisionBox: string;
}

export interface AIUserPreferences {
  learningStyle: LearningStyle;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: string;
  topicsOfInterest: string[];
}

export interface AIContext {
  userId: string;
  userName: string;
  userClass?: string;
  userRole: UserRole;
  targetExams?: string[];
  preferences: AIUserPreferences;
}

export interface AINotesRequest {
  subject: string;
  topic: string;
  chapter?: string;
  classLevel?: string;
  context: AIContext;
}

export interface AIDoubtsRequest {
  doubt: string;
  subject: string;
  topic?: string;
  context: AIContext;
}

export interface AIGuidanceRequest {
  goal: string;
  topic?: string;
  examName?: string;
  context: AIContext;
}

export interface AIServiceConfig {
  apiKey?: string;
  model: AIModel;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AIResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  timestamp: number;
}
