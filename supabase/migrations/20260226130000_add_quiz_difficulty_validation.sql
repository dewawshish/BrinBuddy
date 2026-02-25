-- Validation function to ensure all questions have valid difficulty values
CREATE OR REPLACE FUNCTION public.validate_quiz_difficulty()
RETURNS trigger AS $$
DECLARE
  question jsonb;
BEGIN
  -- Validate each question has difficulty field with valid value
  FOR question IN SELECT jsonb_array_elements(NEW.questions)
  LOOP
    IF NOT (question->>'difficulty' IN ('easy', 'medium', 'hard')) THEN
      RAISE EXCEPTION 'Invalid difficulty value. Must be easy, medium, or hard for question: %', (question->>'question')::text;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS quiz_difficulty_validation ON public.quizzes;

-- Create trigger to validate difficulty on insert and update
CREATE TRIGGER quiz_difficulty_validation
BEFORE INSERT OR UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.validate_quiz_difficulty();

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_quiz_difficulty() IS
'Validates that all questions in a quiz have a valid difficulty level (easy, medium, or hard)';
