import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type CoinContextType = {
  coins: number;
  unlockedGames: string[];
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<boolean>;
  unlockGame: (gameId: string, price: number) => Promise<boolean>;
  isUnlocked: (gameId: string) => boolean;
  loading: boolean;
};

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const useCoins = () => {
  const ctx = useContext(CoinContext);
  if (!ctx) throw new Error('useCoins must be used within CoinProvider');
  return ctx;
};

const LOCAL_KEY = 'bb_coins_v1';
const LOCAL_UNLOCK_KEY = 'bb_unlocked_games_v1';

export const CoinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [coins, setCoins] = useState<number>(0);
  const [unlockedGames, setUnlockedGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Try to load from backend if user is present
      if (user) {
        try {
          // The project's public `profiles` table does not contain `coins`/`unlocked_games` columns
          // (these used to exist in older schemas). Query stable columns and fall back to
          // local storage for coins/unlockedGames. This avoids PostgREST 400 errors when
          // unknown columns are requested.
          const { data, error } = await supabase
            .from('profiles')
            .select('total_xp, unlocked_modes')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            // Map available backend fields to local state where possible. If the project
            // later adds `coins`/`unlocked_games` revert this to the proper column names.
            setCoins((data as any).coins ?? (data.total_xp ?? 0));
            const unlocked = (data as any).unlocked_games ?? (data.unlocked_modes ?? []);
            setUnlockedGames(Array.isArray(unlocked) ? unlocked : []);
            // also mirror to localStorage for offline fallback
            try { localStorage.setItem(LOCAL_KEY, String((data as any).coins ?? (data.total_xp ?? 0))); } catch {}
            try { localStorage.setItem(LOCAL_UNLOCK_KEY, JSON.stringify(Array.isArray(unlocked) ? unlocked : [])); } catch {}
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error loading coin profile:', err);
        }
      }

      // Fallback to localStorage
      try {
        const c = Number(localStorage.getItem(LOCAL_KEY) ?? '0');
        const u = JSON.parse(localStorage.getItem(LOCAL_UNLOCK_KEY) || '[]');
        setCoins(Number.isFinite(c) ? c : 0);
        setUnlockedGames(Array.isArray(u) ? u : []);
      } catch (err) {
        setCoins(0);
        setUnlockedGames([]);
      }
      setLoading(false);
    };

    init();
  }, [user]);

  const persist = async (newCoins: number, newUnlocked: string[]) => {
    // update localStorage
    try { localStorage.setItem(LOCAL_KEY, String(newCoins)); } catch {}
    try { localStorage.setItem(LOCAL_UNLOCK_KEY, JSON.stringify(newUnlocked)); } catch {}

    if (user) {
      try {
        // Update columns that exist in the current schema. Older columns like
        // `coins`/`unlocked_games` may not exist and will cause 400 errors — map to
        // `total_xp`/`unlocked_modes` where possible to keep server in sync.
        const payload: any = {
          total_xp: newCoins,
          unlocked_modes: newUnlocked,
        };

        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating coins in profile:', error);
        }
      } catch (err) {
        console.error('Error updating coins:', err);
      }
    }
  };

  const addCoins = async (amount: number) => {
    if (amount <= 0) return;
    const newCoins = Math.max(0, coins + amount);
    setCoins(newCoins);
    await persist(newCoins, unlockedGames);
    // subtle toast animation
    toast.success(`+${amount} coins`);
  };

  const deductCoins = async (amount: number) => {
    if (amount <= 0) return true;
    if (coins < amount) return false;
    const newCoins = Math.max(0, coins - amount);
    setCoins(newCoins);
    await persist(newCoins, unlockedGames);
    return true;
  };

  const unlockGame = async (gameId: string, price: number) => {
    if (unlockedGames.includes(gameId)) return true;
    if (coins < price) return false;
    const success = await deductCoins(price);
    if (!success) return false;
    const newUnlocked = [...unlockedGames, gameId];
    setUnlockedGames(newUnlocked);
    await persist(coins - price, newUnlocked);
    toast.success('Game unlocked!');
    return true;
  };

  const isUnlocked = (gameId: string) => unlockedGames.includes(gameId);

  return (
    <CoinContext.Provider value={{ coins, unlockedGames, addCoins, deductCoins, unlockGame, isUnlocked, loading }}>
      {children}
    </CoinContext.Provider>
  );
};

export default CoinContext;
