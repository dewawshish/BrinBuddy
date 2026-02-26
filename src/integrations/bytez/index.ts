/**
 * Bytez API Integration
 * 
 * SECURITY: All Bytez API calls go through Edge Functions - no client-side API keys.
 * This module provides helper functions for calling the secure edge functions.
 * 
 * Edge functions that handle Bytez AI calls:
 * - generate-notes: For AI-powered notes generation
 * - generate-quiz: For quiz question generation
 * - find-video: For video recommendations
 * - adaptive-question: For adaptive quiz questions
 * - analyze-weakness: For weakness analysis
 * - fix-weak-areas-quiz: For targeted practice quizzes
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Generate study notes using the secure generate-notes edge function
 */
export async function generateNotesWithBytez(
  videoTitle: string,
  videoContent: string,
  filters: {
    class?: string;
    subject?: string;
    language?: string;
    board?: string;
  }
): Promise<{ notes?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-notes', {
      body: {
        videoTitle,
        videoContent,
        filters
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { error: error.message || 'Failed to generate notes' };
    }

    return { notes: data?.notes };
  } catch (err) {
    console.error('Notes generation error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

/**
 * Generate quiz questions using the secure generate-quiz edge function
 */
export async function generateQuizWithBytez(
  notes: string,
  filters: {
    class?: string;
    subject?: string;
    board?: string;
  },
  questionCount: number = 10,
  difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<{ questions?: Record<string, unknown>[]; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        notes,
        filters,
        questionCount,
        difficultyLevel
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { error: error.message || 'Failed to generate quiz' };
    }

    return { questions: data?.questions || [] };
  } catch (err) {
    console.error('Quiz generation error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

/**
 * Find educational videos using the secure find-video edge function
 * Validates that videos are NOT shorts (duration >= 10 minutes)
 */
export async function findVideoWithBytez(
  topic: string,
  filters: {
    class?: string;
    subject?: string;
    board?: string;
    language?: string;
    videoType?: string;
    videoDuration?: string;
  }
): Promise<{ videos?: Record<string, unknown>[]; error?: string }> {
  // Validate that user is not searching for YouTube shorts
  if (topic.toLowerCase().includes('shorts') || topic.includes('youtube.com/shorts')) {
    return {
      error: 'YouTube Shorts are not supported for learning. Please search for full-length educational videos instead.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('find-video', {
      body: {
        topic,
        filters
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { error: error.message || 'Failed to find videos' };
    }

    const videos = data?.videos || [];
    
    // Previously we filtered out videos shorter than 10 minutes on the client,
    // but this often removed valid educational content.  Return whatever the
    // edge function provided so the UI can decide how to handle short videos.
    return { videos };
  } catch (err) {
    console.error('Video search error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

/**
 * Validate that a video is not a YouTube short
 */
export function validateVideoNotShort(url: string): { valid: boolean; message?: string } {
  if (url.includes('youtube.com/shorts') || url.includes('youtu.be/shorts')) {
    return {
      valid: false,
      message: 'YouTube Shorts are not supported. Please use full-length educational videos (minimum 10 minutes).',
    };
  }

  return { valid: true };
}
