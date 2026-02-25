/**
 * Quiz Completion Modal Component
 * Displays quiz results with score, coins earned, and reward breakdown by difficulty
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
import { Badge } from '@/components/ui/badge';
import { Trophy, Coins, CheckCircle } from 'lucide-react';

interface QuizCompletionModalProps {
  open: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  coinsEarned: number;
  rewardBreakdown?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export const QuizCompletionModal: React.FC<QuizCompletionModalProps> = ({
  open,
  onClose,
  score,
  totalQuestions,
  correctAnswers,
  coinsEarned,
  rewardBreakdown,
}) => {
  const isPassing = score >= 60;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isPassing
                ? 'bg-success/10'
                : 'bg-primary/10'
            }`}>
              <Trophy className={`w-8 h-8 ${isPassing ? 'text-success' : 'text-primary'}`} />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            {isPassing ? 'Great Job!' : 'Quiz Complete!'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            {/* Score Display */}
            <div>
              <div className="text-4xl font-bold">{score}%</div>
              <div className="text-sm text-muted-foreground">
                {correctAnswers} of {totalQuestions} correct
              </div>
            </div>

            {/* Coins Earned Section */}
            {coinsEarned > 0 && (
              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-500">+{coinsEarned}</span>
                </div>
                <p className="text-xs text-muted-foreground">coins earned</p>
              </div>
            )}

            {/* Reward Breakdown by Difficulty */}
            {rewardBreakdown && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-sm font-semibold text-left">Rewards Breakdown:</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                        Easy
                      </Badge>
                      <span className="text-muted-foreground">(2 coins each)</span>
                    </div>
                    <span className="font-semibold">+{rewardBreakdown.easy}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                        Medium
                      </Badge>
                      <span className="text-muted-foreground">(5 coins each)</span>
                    </div>
                    <span className="font-semibold">+{rewardBreakdown.medium}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                        Hard
                      </Badge>
                      <span className="text-muted-foreground">(10 coins each)</span>
                    </div>
                    <span className="font-semibold">+{rewardBreakdown.hard}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Motivational Message */}
            {isPassing ? (
              <div className="pt-2 flex items-center justify-center gap-2 text-success">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm">Excellent understanding of the material!</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pt-2">
                Keep practicing to master this topic!
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            {isPassing ? 'Awesome!' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default QuizCompletionModal;
