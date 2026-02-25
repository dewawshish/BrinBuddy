/**
 * Insufficient Coins Dialog Component
 * Displays when user tries to unlock a game but doesn't have enough coins
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coins } from 'lucide-react';

interface InsufficientCoinsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  needed: number;
  current: number;
}

export const InsufficientCoinsDialog: React.FC<InsufficientCoinsDialogProps> = ({
  open,
  onOpenChange,
  needed,
  current,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Coins className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Not Enough Coins</AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>You need to complete quizzes and earn coins to unlock this game.</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm font-medium">
              <div className="text-muted-foreground">
                Current: <span className="text-foreground">{current}</span>
              </div>
              <div className="text-muted-foreground">
                Need: <span className="text-destructive">{needed}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Complete quizzes and challenges to earn more coins!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InsufficientCoinsDialog;
