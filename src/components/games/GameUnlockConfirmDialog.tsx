/**
 * Game Unlock Confirmation Dialog Component
 * Confirms the user wants to spend coins to unlock a game
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Gamepad2, Coins } from 'lucide-react';

interface GameUnlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  gameName: string;
  price: number;
  currentCoins: number;
  isLoading?: boolean;
}

export const GameUnlockConfirmDialog: React.FC<GameUnlockConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  gameName,
  price,
  currentCoins,
  isLoading = false,
}) => {
  const coinsRemaining = currentCoins - price;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Unlock {gameName}?</AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              Spend{' '}
              <span className="font-semibold text-foreground inline-flex items-center gap-1">
                <Coins className="w-4 h-4" />
                {price}
              </span>
              {' '}coins to unlock this game permanently.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
              <Coins className="w-4 h-4" />
              <span>
                After unlock: <span className="font-semibold text-foreground">{coinsRemaining}</span> coins remaining
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Unlocking...' : 'Unlock Game'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameUnlockConfirmDialog;
