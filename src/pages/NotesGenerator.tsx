import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Copy, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAIService } from '@/lib/ai/service';
import { AINotesStructure } from '@/types/ai';
import { formatNotesForDisplay } from '@/lib/ai/responseFormatter';
import { ScrollArea } from '@/components/ui/scroll-area';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Geography',
  'English Literature',
  'Economics',
  'Psychology',
];

const LEARNING_STYLES = [
  { value: 'quick', label: 'Quick (Bullet Points)' },
  { value: 'detailed', label: 'Detailed (Comprehensive)' },
  { value: 'exam-focused', label: 'Exam Focused' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const NotesGenerator = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const aiService = getAIService();

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [chapter, setChapter] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [learningStyle, setLearningStyle] = useState<'quick' | 'detailed' | 'exam-focused'>('detailed');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<AINotesStructure | null>(null);
  const [formattedNotes, setFormattedNotes] = useState('');

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !topic.trim()) {
      toast.error('Please enter subject and topic');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.generateNotes({
        subject,
        topic,
        chapter,
        classLevel,
        context: {
          userId: profile?.user_id || '',
          userName: profile?.name || user?.email?.split('@')[0] || 'Student',
          userClass: classLevel,
          userRole: 'student',
          preferences: {
            learningStyle,
            difficultyLevel: difficulty,
            preferredLanguage: 'English',
            topicsOfInterest: [topic],
          },
        },
      });

      if (result.success && result.data) {
        setNotes(result.data);
        setFormattedNotes(formatNotesForDisplay(result.data));
        toast.success('Notes generated successfully!');
      } else {
        toast.error(result.error || 'Failed to generate notes');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(formattedNotes);
    toast.success('Notes copied to clipboard!');
  };

  const handleDownloadNotes = () => {
    const element = document.createElement('a');
    const file = new Blob([formattedNotes], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${topic.replace(/\s+/g, '_')}_notes.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Notes downloaded!');
  };

  const handleRegenerate = () => {
    setNotes(null);
    setFormattedNotes('');
    handleGenerateNotes(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="glass-card border-border/50 lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Generate Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateNotes} className="space-y-4">
                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject *</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic/Chapter *</label>
                  <Input
                    placeholder="e.g., Photosynthesis, Calculus Basics"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                {/* Chapter (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter Number (Optional)</label>
                  <Input
                    placeholder="e.g., Chapter 5"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                  />
                </div>

                {/* Class Level (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class/Level (Optional)</label>
                  <Input
                    placeholder="e.g., 10th, CBSE, Grade 12"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                  />
                </div>

                {/* Learning Style */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Learning Style</label>
                  <Select value={learningStyle} onValueChange={(v: any) => setLearningStyle(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNING_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !subject || !topic}
                  variant="neon"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Notes'
                  )}
                </Button>

                {notes && (
                  <div className="pt-4 border-t border-border/50 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleCopyNotes}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleDownloadNotes}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRegenerate}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Notes Display Section */}
          <Card className="glass-card border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle>Study Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {notes ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6 text-sm">
                    {/* Quick Overview */}
                    {notes.quickOverview && (
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                        <h3 className="font-semibold text-primary mb-2">📌 Overview</h3>
                        <p className="text-foreground">{notes.quickOverview}</p>
                      </div>
                    )}

                    {/* Key Concepts */}
                    {notes.keyConcepts?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">🎯 Key Concepts</h3>
                        <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                          {notes.keyConcepts.map((concept, i) => (
                            <li key={i} className="text-foreground">
                              {concept}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Detailed Explanation */}
                    {notes.detailedExplanation && (
                      <div>
                        <h3 className="font-semibold mb-2">📖 Detailed Explanation</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{notes.detailedExplanation}</p>
                      </div>
                    )}

                    {/* Examples */}
                    {notes.examplesApplications && (
                      <div>
                        <h3 className="font-semibold mb-2">💡 Examples & Applications</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{notes.examplesApplications}</p>
                      </div>
                    )}

                    {/* Formulas */}
                    {notes.formulasFactsRules && (
                      <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/30">
                        <h3 className="font-semibold mb-2">⚗️ Formulas & Rules</h3>
                        <p className="text-muted-foreground font-mono text-xs whitespace-pre-wrap">{notes.formulasFactsRules}</p>
                      </div>
                    )}

                    {/* Exam Tips */}
                    {notes.examTipsTrap && (
                      <div className="bg-yellow-5 00/10 rounded-lg p-4 border border-yellow-500/20">
                        <h3 className="font-semibold mb-2">⚠️ Exam Tips</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{notes.examTipsTrap}</p>
                      </div>
                    )}

                    {/* Quick Revision */}
                    {notes.quickRevisionBox && (
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                        <h3 className="font-semibold mb-2">✅ Quick Revision</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{notes.quickRevisionBox}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-center">
                  <div>
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Fill the form and click "Generate Notes" to create AI-powered study material
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotesGenerator;
