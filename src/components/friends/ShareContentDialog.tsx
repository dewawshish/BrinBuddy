import { useState, useEffect } from 'react';
import { Trophy, BookOpen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShareContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (type: string, content: unknown) => void;
}

const ShareContentDialog = ({ open, onOpenChange, onShare }: ShareContentDialogProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'quiz' | 'notes'>('quiz');
  const [quizResults, setQuizResults] = useState<Record<string, unknown>[]>([]);
  const [notes, setNotes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      Promise.all([
        supabase
          .from('quiz_results')
          .select('id, score, correct_answers, total_questions, created_at, todo_id')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('notes')
          .select('id, content, todo_id, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]).then(([quizRes, notesRes]) => {
        setQuizResults(quizRes.data || []);
        setNotes(notesRes.data || []);
        setLoading(false);
      });
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Study Content</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === 'quiz' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('quiz')}
          >
            <Trophy className="h-4 w-4 mr-1" /> Quiz Results
          </Button>
          <Button
            variant={tab === 'notes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('notes')}
          >
            <BookOpen className="h-4 w-4 mr-1" /> Notes
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tab === 'quiz' ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {quizResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No quiz results to share.</p>
            ) : (
              quizResults.map((q, idx) => {
                const qData = q as Record<string, unknown>;
                const id = String(qData.id || idx);
                const score = qData.score as number;
                const correctAnswers = qData.correct_answers as number;
                const totalQuestions = qData.total_questions as number;
                return (
                  <button
                    key={id}
                    onClick={() =>
                      onShare('quiz_share', {
                        score,
                        correct: correctAnswers,
                        total: totalQuestions,
                      })
                    }
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Score: {score}%</span>
                      <span className="text-xs text-muted-foreground">
                        {correctAnswers}/{totalQuestions} correct
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notes to share.</p>
            ) : (
              notes.map((n, idx) => {
                const nData = n as Record<string, unknown>;
                const id = String(nData.id || idx);
                const content = String(nData.content || '');
                const contentPreview = content.substring(0, 100) || 'Study Notes';
                return (
                  <button
                    key={id}
                    onClick={() =>
                      onShare('notes_share', {
                        title: contentPreview,
                        noteId: id,
                      })
                    }
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="text-sm line-clamp-2">{contentPreview}</p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareContentDialog;
