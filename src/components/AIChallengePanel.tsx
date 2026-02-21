import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { AIMessage } from '@/types/ai';
import { getAIService } from '@/lib/ai/service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIChallengePanelProps {
  onClose?: () => void;
  isCompact?: boolean;
}

const AIChallengePanel: React.FC<AIChallengePanelProps> = ({ onClose, isCompact = false }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m BrainBuddy AI. I\'m here to help you with:\n- Topic-wise notes generation\n- Solving your doubts\n- Study guidance & exam help\n\nWhat would you like help with?',
      timestamp: Date.now(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiService = getAIService();

  useEffect(() => {
    // Auto scroll to latest message
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const result = await aiService.chat(profile?.user_id || 'anonymous', newMessage, {
        userId: profile?.user_id || '',
        userName: profile?.name || 'Student',
        userRole: 'student',
        preferences: {
          learningStyle: 'detailed',
          difficultyLevel: 'intermediate',
          preferredLanguage: 'English',
          topicsOfInterest: [],
        },
      });

      if (result.success && result.data?.response) {
        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast.error(result.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  if (isCompact) {
    // Compact inline version for dashboard
    return (
      <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            BrainBuddy AI
          </h3>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ask me anything about your studies! Generate notes, solve doubts, or get exam guidance.
        </p>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask BrainBuddy AI..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            className="text-sm"
          />
          <Button type="submit" disabled={loading || !newMessage.trim()} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    );
  }

  // Full panel version
  return (
    <div className="glass-card rounded-2xl h-full flex flex-col border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          BrainBuddy AI
        </h3>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex items-end gap-2 animate-fade-in', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                  🧠
                </div>
              )}

              <div
                className={cn(
                  'max-w-xs lg:max-w-md px-4 py-2 rounded-lg whitespace-pre-wrap break-words text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-background border border-border/50 text-foreground rounded-bl-none'
                )}
              >
                {message.content}
              </div>

              {message.role === 'assistant' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => copyMessage(message.content)}
                  title="Copy message"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
              <div className="bg-background border border-border/50 rounded-lg px-4 py-2 text-sm text-muted-foreground">
                BrainBuddy is thinking...
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask BrainBuddy AI..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            className="text-sm"
          />
          <Button type="submit" disabled={loading || !newMessage.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChallengePanel;
