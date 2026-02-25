-- Migration: Add Atomic Coin Transaction Function
-- Description: Creates a secure, transactional function for adding coins with proper validation and audit logging

-- Create the atomic coin transaction function
CREATE OR REPLACE FUNCTION public.add_coins_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_total INTEGER;
  v_previous_total INTEGER;
BEGIN
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_amount',
      'message', 'Coin amount must be positive'
    );
  END IF;

  -- Lock the profile row to prevent race conditions
  SELECT total_xp INTO v_previous_total
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Handle case where profile doesn't exist
  IF v_previous_total IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'User profile not found'
    );
  END IF;

  -- Calculate new total
  v_new_total := v_previous_total + p_amount;

  -- Add coins
  UPDATE public.profiles
  SET
    total_xp = v_new_total,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log the coin award for audit trail
  PERFORM public.log_audit_event(
    p_user_id,
    'coin_reward',
    p_source,
    NULL,
    jsonb_build_object(
      'amount', p_amount,
      'previous_total', v_previous_total,
      'new_total', v_new_total,
      'metadata', p_metadata
    )
  );

  RETURN json_build_object(
    'success', true,
    'coins_added', p_amount,
    'previous_total', v_previous_total,
    'new_total', v_new_total
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_coins_transaction(UUID, INTEGER, TEXT, JSONB) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.add_coins_transaction(UUID, INTEGER, TEXT, JSONB) IS
'Atomically adds coins to a user profile with audit logging.
Uses row-level locking to prevent race conditions.
Validates amount is positive and user profile exists.
Logs all coin awards to audit_logs table with source and metadata.
Returns JSON with success status, error details if any, and coin totals.';
