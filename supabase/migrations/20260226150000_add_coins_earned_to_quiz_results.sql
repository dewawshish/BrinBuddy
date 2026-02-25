-- Migration: Add coins_earned column to quiz_results
-- Description: Track coins earned from quiz completion for difficulty-based reward system

-- Add coins_earned column if it doesn't exist
ALTER TABLE public.quiz_results
ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;

-- Add quiz_id column if it doesn't exist (for future quiz-based queries instead of todo_id)
ALTER TABLE public.quiz_results
ADD COLUMN IF NOT EXISTS quiz_id UUID;

-- Add foreign key constraint to quizzes table if quiz_id exists
ALTER TABLE public.quiz_results
ADD CONSTRAINT fk_quiz_results_quiz_id
FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- Create index on coins_earned for analytics queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_coins_earned
ON public.quiz_results (coins_earned DESC);

-- Create composite index for user quiz analytics
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_coins
ON public.quiz_results (user_id, coins_earned DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.quiz_results.coins_earned IS
'Total coins earned from this quiz completion based on difficulty-weighted rewards';

COMMENT ON COLUMN public.quiz_results.quiz_id IS
'Reference to the quiz that was completed (optional, for direct quiz tracking)';
