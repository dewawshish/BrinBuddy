/**
 * Game Unlock Celebration Component
 * Shows celebratory animation with confetti when a game is successfully unlocked
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gamepad2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameUnlockCelebrationProps {
  open: boolean;
  onClose: () => void;
  gameName: string;
  gameDescription: string;
}

export const GameUnlockCelebration: React.FC<GameUnlockCelebrationProps> = ({
  open,
  onClose,
  gameName,
  gameDescription,
}) => {
  useEffect(() => {
    if (!open) return;

    // Launch confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      // Confetti from left side
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493'],
      });

      // Confetti from right side
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative z-50 glass-card p-8 rounded-2xl max-w-md w-full mx-4 border-2 border-primary/20 pointer-events-auto"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Game Unlocked!
            </h2>
          </motion.div>

          {/* Game Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <h3 className="text-xl font-semibold">{gameName}</h3>
            <p className="text-sm text-muted-foreground">{gameDescription}</p>
          </motion.div>

          {/* Ready Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-primary font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ready to play anytime!</span>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={onClose} size="lg" className="w-full">
              Awesome!
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameUnlockCelebration;
