import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Brain,
  Sparkles,
  MessageCircle,
  BookOpen,
  HelpCircle,
  Settings2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAI } from '@/contexts/AIContext';
import { cn } from '@/lib/utils';

interface BrainBuddyAIPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

const BrainBuddyAIPanel: React.FC<BrainBuddyAIPanelProps> = ({
  isOpen = true,
  onClose,
  compact = false,
}) => {
  const { chatHistory, isLoading, aiProfile, addMessage, sendMessage, updateAIProfile } = useAI();
  const [inputValue, setInputValue] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [messageType, setMessageType] = useState<'chat' | 'notes' | 'doubt' | 'exam-help'>(
    'chat'
  );
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      // Add user message
      addMessage({
        role: 'user',
        content: inputValue.trim(),
        subject: selectedSubject,
        type: messageType,
      });

      const userInput = inputValue;
      setInputValue('');

      // Send to AI
      await sendMessage(userInput, selectedSubject);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleLearningStyleChange = (style: 'quick' | 'detailed' | 'exam-focused') => {
    updateAIProfile({ learningStyle: style });
    toast.success(`Learning style changed to: ${style}`);
  };

  const handleDifficultyChange = (level: 'beginner' | 'intermediate' | 'advanced') => {
    updateAIProfile({ difficultyLevel: level });
    toast.success(`Difficulty level set to: ${level}`);
  };

  if (!isOpen) return null;

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];

  return (
    <Card className={cn('glass-card flex flex-col h-full', compact ? 'max-h-96' : 'h-screen')}>
      {/* Header */}
      <CardHeader className="border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>BrainBuddy AI</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  BETA
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Your AI study companion
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border/50 p-3 space-y-3 flex-shrink-0 bg-background/50">
          <div>
            <label className="text-xs font-semibold block mb-2">Learning Style</label>
            <Select
              value={aiProfile?.learningStyle || 'detailed'}
              onValueChange={(value: string) =>
                handleLearningStyleChange(value)
              }
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">⚡ Quick & Concise</SelectItem>
                <SelectItem value="detailed">📖 Detailed Explanation</SelectItem>
                <SelectItem value="exam-focused">🎯 Exam Focused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2">Difficulty Level</label>
            <Select
              value={aiProfile?.difficultyLevel || 'intermediate'}
              onValueChange={(value: string) =>
                handleDifficultyChange(value)
              }
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">🌱 Beginner</SelectItem>
                <SelectItem value="intermediate">📚 Intermediate</SelectItem>
                <SelectItem value="advanced">🚀 Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Chat History */}
      <CardContent className={cn('flex-1 overflow-y-auto p-3 space-y-3', 
        compact ? 'max-h-64' : '')}>
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Start a conversation or generate notes
              </p>
              <p className="text-xs text-muted-foreground/50 mt-2">
                Tip: Select a subject first for better responses
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((message) => (
            <div
              key={message.id}
              className={cn(
                'p-3 rounded-lg max-w-[80%]',
                message.role === 'user'
                  ? 'bg-primary/20 text-primary ml-auto'
                  : 'bg-background border border-border/50'
              )}
            >
              <p className="text-sm">{message.content}</p>
              {message.subject && (
                <p className="text-xs text-muted-foreground mt-1">
                  📚 {message.subject}
                </p>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2 p-3 bg-background border border-border/50 rounded-lg w-fit">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Area */}
      <div className="border-t border-border/50 p-3 space-y-2 flex-shrink-0 bg-background/50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Select value={messageType} onValueChange={(value: string) => setMessageType(value)}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> Chat
                </span>
              </SelectItem>
              <SelectItem value="notes">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Notes
                </span>
              </SelectItem>
              <SelectItem value="doubt">
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" /> Doubt
                </span>
              </SelectItem>
              <SelectItem value="exam-help">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Exam Help
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="text-sm h-8"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            size="sm"
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </form>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-background/50 p-2 rounded border border-border/30">
            <p className="text-muted-foreground">Notes</p>
            <p className="font-bold">{aiProfile?.aiUsageStats.notesGenerated || 0}</p>
          </div>
          <div className="bg-background/50 p-2 rounded border border-border/30">
            <p className="text-muted-foreground">Doubts</p>
            <p className="font-bold">{aiProfile?.aiUsageStats.doubtsResolved || 0}</p>
          </div>
          <div className="bg-background/50 p-2 rounded border border-border/30">
            <p className="text-muted-foreground">Learning</p>
            <p className="font-bold text-primary">{aiProfile?.learningStyle[0].toUpperCase()}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BrainBuddyAIPanel;
