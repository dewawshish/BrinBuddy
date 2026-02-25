/**
 * Game Unlock Service
 * Handles secure, transactional game unlocking with proper validation and error handling
 */

import { supabase } from '@/integrations/supabase/client';

export interface GameUnlockResult {
  success: boolean;
  error?: 'already_unlocked' | 'insufficient_coins' | 'unknown';
  message?: string;
  required?: number;
  current?: number;
  needed?: number;
  coins_remaining?: number;
}

/**
 * Game configuration with prices and metadata
 */
export const GAMES_CONFIG = {
  'rushlane-x': {
    id: 'rushlane-x',
    title: 'Rushlane X',
    description: 'A fast-paced arcade runner with powerups and score-chasing.',
    price: 100,
  },
  'epic-era-battles': {
    id: 'epic-era-battles',
    title: 'Epic Era Battles',
    description: 'A strategy battle game. Short skirmishes, big decisions.',
    price: 200,
  },
} as const;

export type GameId = keyof typeof GAMES_CONFIG;

/**
 * Unlock a game using atomic database transaction
 * Ensures atomicity and prevents race conditions
 *
 * @param userId - The user's UUID
 * @param gameId - The game ID to unlock
 * @returns GameUnlockResult with success status and details
 */
export async function unlockGameTransaction(
  userId: string,
  gameId: string
): Promise<GameUnlockResult> {
  // Validate game exists
  const gameConfig = GAMES_CONFIG[gameId as GameId];

  if (!gameConfig) {
    return {
      success: false,
      error: 'unknown',
      message: 'Invalid game ID',
    };
  }

  try {
    // Call the atomic database function
    const { data, error } = await supabase.rpc('unlock_game_transaction', {
      p_user_id: userId,
      p_game_id: gameId,
      p_price: gameConfig.price,
    });

    if (error) {
      console.error('Error unlocking game:', error);
      return {
        success: false,
        error: 'unknown',
        message: error.message || 'Failed to unlock game',
      };
    }

    // Return the result from database function
    return data as GameUnlockResult;
  } catch (err) {
    console.error('Unexpected error unlocking game:', err);
    return {
      success: false,
      error: 'unknown',
      message: 'An unexpected error occurred',
    };
  }
}

/**
 * Get game configuration by ID
 *
 * @param gameId - The game ID
 * @returns Game configuration or undefined
 */
export function getGameConfig(gameId: string) {
  return GAMES_CONFIG[gameId as GameId];
}

/**
 * Get all available games
 *
 * @returns Array of game configurations
 */
export function getAllGames() {
  return Object.values(GAMES_CONFIG);
}

/**
 * Check if a user has sufficient coins to unlock a game
 *
 * @param currentCoins - User's current coin balance
 * @param gameId - The game ID
 * @returns true if user has sufficient coins
 */
export function hasSufficientCoins(currentCoins: number, gameId: string): boolean {
  const gameConfig = GAMES_CONFIG[gameId as GameId];
  if (!gameConfig) return false;
  return currentCoins >= gameConfig.price;
}

/**
 * Calculate coins needed to unlock a game
 *
 * @param currentCoins - User's current coin balance
 * @param gameId - The game ID
 * @returns Coins needed (0 if sufficient, positive number if not enough)
 */
export function calculateCoinsNeeded(currentCoins: number, gameId: string): number {
  const gameConfig = GAMES_CONFIG[gameId as GameId];
  if (!gameConfig) return 0;

  const needed = gameConfig.price - currentCoins;
  return needed > 0 ? needed : 0;
}
