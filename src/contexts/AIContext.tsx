import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  subject?: string;
  type?: 'chat' | 'notes' | 'doubt' | 'exam-help';
}

export interface AIProfile {
  learningStyle: 'quick' | 'detailed' | 'exam-focused';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  notesGenerated: number;
  aiUsageStats: {
    notesGenerated: number;
    doubtsResolved: number;
    charactersUsed: number;
  };
  topicsCompleted: string[];
}

interface AIContextType {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  aiProfile: AIProfile | null;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  updateAIProfile: (profile: Partial<AIProfile>) => void;
  sendMessage: (message: string, subject?: string) => Promise<string>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiProfile, setAIProfile] = useState<AIProfile>({
    learningStyle: 'detailed',
    difficultyLevel: 'intermediate',
    notesGenerated: 0,
    aiUsageStats: {
      notesGenerated: 0,
      doubtsResolved: 0,
      charactersUsed: 0,
    },
    topicsCompleted: [],
  });

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, newMessage]);
  }, []);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  const updateAIProfile = useCallback((profile: Partial<AIProfile>) => {
    setAIProfile((prev) => ({ ...prev, ...profile }));
  }, []);

  const sendMessage = async (message: string, subject?: string): Promise<string> => {
    setIsLoading(true);
    try {
      // Call Supabase Edge Function for AI response
      const { data, error } = await supabase.functions.invoke('brainbuddy-ai-chat', {
        body: {
          message,
          subject,
          learningStyle: aiProfile.learningStyle,
          difficultyLevel: aiProfile.difficultyLevel,
          chatHistory: chatHistory.slice(-5), // Last 5 messages for context
        },
      });

      if (error) throw error;

      const aiResponse = data.response || 'I apologize, I could not generate a response. Please try again.';
      addMessage({
        role: 'assistant',
        content: aiResponse,
        subject,
        type: 'chat',
      });

      // Update usage stats
      setAIProfile((prev) => ({
        ...prev,
        aiUsageStats: {
          ...prev.aiUsageStats,
          charactersUsed: prev.aiUsageStats.charactersUsed + aiResponse.length,
          doubtsResolved:
            subject && subject.toLowerCase().includes('doubt')
              ? prev.aiUsageStats.doubtsResolved + 1
              : prev.aiUsageStats.doubtsResolved,
        },
      }));

      return aiResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        chatHistory,
        isLoading,
        aiProfile,
        addMessage,
        clearHistory,
        updateAIProfile,
        sendMessage,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};
