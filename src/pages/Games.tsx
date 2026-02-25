import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCoins } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Lock, Play } from 'lucide-react';
import { InsufficientCoinsDialog } from '@/components/games/InsufficientCoinsDialog';
import { GameUnlockConfirmDialog } from '@/components/games/GameUnlockConfirmDialog';
import { GameUnlockCelebration } from '@/components/games/GameUnlockCelebration';
import { unlockGameTransaction, GAMES_CONFIG, getAllGames } from '@/services/gameUnlockService';
import { toast } from 'sonner';

const Games: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coins, isUnlocked, unlockGame } = useCoins();

  // Dialog states
  const [insufficientDialog, setInsufficientDialog] = useState<{
    open: boolean;
    needed: number;
    current: number;
  }>({ open: false, needed: 0, current: 0 });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    gameId: string;
    gameName: string;
    price: number;
    isLoading: boolean;
  }>({ open: false, gameId: '', gameName: '', price: 0, isLoading: false });

  const [celebration, setCelebration] = useState<{
    open: boolean;
    gameName: string;
    gameDescription: string;
  }>({ open: false, gameName: '', gameDescription: '' });

  const handleUnlock = (gameId: string, gameName: string, _gameDescription: string, price: number) => {
    // If already unlocked, play immediately
    if (isUnlocked(gameId)) {
      navigate(`/games/${gameId}`);
      return;
    }

    // Check if sufficient coins
    if (coins < price) {
      setInsufficientDialog({
        open: true,
        needed: price - coins,
        current: coins,
      });
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      gameId,
      gameName,
      price,
      isLoading: false,
    });
  };

  const handleConfirmUnlock = async () => {
    if (!user) return;

    const { gameId, gameName, price } = confirmDialog;

    // Set loading state
    setConfirmDialog((prev: typeof confirmDialog) => ({ ...prev, isLoading: true }));

    try {
      // Call transaction
      const result = await unlockGameTransaction(user.id, gameId);

      // Close confirmation dialog
      setConfirmDialog({ open: false, gameId: '', gameName: '', price: 0, isLoading: false });

      if (!result.success) {
        // Handle different error types
        if (result.error === 'insufficient_coins') {
          setInsufficientDialog({
            open: true,
            needed: result.needed ?? 0,
            current: result.current ?? coins,
          });
        } else if (result.error === 'already_unlocked') {
          // Navigate to game if already unlocked
          navigate(`/games/${gameId}`);
        } else {
          toast.error(result.message || 'Failed to unlock game');
        }
        return;
      }

      // Update coin context
      await unlockGame(gameId, price);

      // Show celebration
      const gameConfig = GAMES_CONFIG[gameId as keyof typeof GAMES_CONFIG];
      setCelebration({
        open: true,
        gameName: gameConfig?.title ?? gameName,
        gameDescription: gameConfig?.description ?? '',
      });
    } catch (error) {
      setConfirmDialog((prev: typeof confirmDialog) => ({ ...prev, isLoading: false }));
      toast.error('An unexpected error occurred');
      console.error('Error unlocking game:', error);
    }
  };

  const handleCelebrationClose = () => {
    setCelebration({ ...celebration, open: false });
    // Navigate to the game after celebration closes
    const gameId = Object.entries(GAMES_CONFIG).find(
      ([_, config]) => config.title === celebration.gameName
    )?.[0];
    if (gameId) {
      navigate(`/games/${gameId}`);
    }
  };

  const GAMES = getAllGames();

  return (
    <div className="min-h-screen container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🎮 Games</h1>
      <p className="text-sm text-muted-foreground mb-6">Play mini-games using coins earned from quizzes.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((g) => (
          <div key={g.id} className="glass-card p-4 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{g.title}</h2>
                <p className="text-sm text-muted-foreground">{g.description}</p>
                <div className="mt-3 text-sm">
                  Price: <b>{g.price}</b> coins
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isUnlocked(g.id) ? (
                  <div className="flex items-center gap-2 text-success">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm">Unlocked</span>
                  </div>
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Button
                    onClick={() => handleUnlock(g.id, g.title, g.description, g.price)}
                    disabled={confirmDialog.isLoading}
                  >
                    {isUnlocked(g.id) ? <Play className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    {isUnlocked(g.id) ? 'Play' : 'Unlock'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <InsufficientCoinsDialog
        open={insufficientDialog.open}
        onOpenChange={(open: boolean) => setInsufficientDialog({ ...insufficientDialog, open })}
        needed={insufficientDialog.needed}
        current={insufficientDialog.current}
      />

      <GameUnlockConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}
        onConfirm={handleConfirmUnlock}
        gameName={confirmDialog.gameName}
        price={confirmDialog.price}
        currentCoins={coins}
        isLoading={confirmDialog.isLoading}
      />

      <GameUnlockCelebration
        open={celebration.open}
        onClose={handleCelebrationClose}
        gameName={celebration.gameName}
        gameDescription={celebration.gameDescription}
      />
    </div>
  );
};

export default Games;
