-- Migration: Add Atomic Game Unlock Transaction Function
-- Description: Creates a secure, transactional function for unlocking games with proper validation and audit logging

-- Create the atomic game unlock function
CREATE OR REPLACE FUNCTION public.unlock_game_transaction(
  p_user_id UUID,
  p_game_id TEXT,
  p_price INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_xp INTEGER;
  v_unlocked_modes JSONB;
  v_result JSON;
BEGIN
  -- Lock the profile row to prevent race conditions
  SELECT total_xp, unlocked_modes INTO v_current_xp, v_unlocked_modes
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if already unlocked
  IF v_unlocked_modes @> to_jsonb(ARRAY[p_game_id]) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_unlocked',
      'message', 'Game is already unlocked'
    );
  END IF;

  -- Check sufficient coins
  IF v_current_xp < p_price THEN
    RETURN json_build_object(
      'success', false,
      'error', 'insufficient_coins',
      'message', 'Not enough coins to unlock this game',
      'required', p_price,
      'current', v_current_xp,
      'needed', p_price - v_current_xp
    );
  END IF;

  -- Atomic update: deduct coins and add to unlocked array
  UPDATE public.profiles
  SET
    total_xp = total_xp - p_price,
    unlocked_modes = COALESCE(unlocked_modes, '[]'::jsonb) || to_jsonb(ARRAY[p_game_id]),
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log the unlock event for audit trail
  PERFORM public.log_audit_event(
    p_user_id,
    'game_unlock',
    'game',
    p_game_id,
    json_build_object(
      'price', p_price,
      'coins_after', v_current_xp - p_price
    )::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'game_id', p_game_id,
    'coins_deducted', p_price,
    'coins_remaining', v_current_xp - p_price
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.unlock_game_transaction(UUID, TEXT, INTEGER) TO authenticated;

-- Create index on unlocked_modes JSONB column for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_unlocked_modes
ON public.profiles USING GIN (unlocked_modes);

-- Add comment for documentation
COMMENT ON FUNCTION public.unlock_game_transaction(UUID, TEXT, INTEGER) IS
'Atomically unlocks a game for a user by deducting coins and updating unlocked_modes array.
Uses row-level locking to prevent race conditions.
Validates coin balance and duplicate unlocks before proceeding.
Logs all unlock events to audit_logs table.
Returns JSON with success status, error details if any, and updated coin balance.';
