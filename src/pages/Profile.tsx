import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Coins, RefreshCw, Loader2, Trophy, Award, TrendingUp, Camera, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AchievementsPanel from '@/components/achievements/AchievementsPanel';
import ImprovementChart from '@/components/ImprovementChart';
import { useCoins } from '@/contexts/CoinContext';

interface UserCredits {
  credits_remaining: number;
  credits_used: number;
  last_reset_at: string;
}

interface AIPreferences {
  learningStyle: 'quick' | 'detailed' | 'exam-focused';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  topicsOfInterest: string[];
}

const TOTAL_MONTHLY_CREDITS = 50;

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [_loading, setLoading] = useState(true);
  const [wasReset, setWasReset] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable profile fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editUserRole, setEditUserRole] = useState<'student' | 'teacher' | 'admin'>('student');

  // AI Preferences
  const [aiPreferences, setAiPreferences] = useState<AIPreferences>({
    learningStyle: 'detailed',
    difficultyLevel: 'intermediate',
    topicsOfInterest: [],
  });

  // Stats
  const [aiStats, _setAiStats] = useState({
    notesGenerated: 0,
    aiUsageCount: 0,
    topicsCompleted: 0,
  });

  const { coins } = useCoins();

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Profile picture updated!');
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      // Use the check_and_reset_credits function which handles monthly reset
      const { data, error } = await supabase.rpc('check_and_reset_credits', {
        uid: user?.id
      });

      if (error) {
        console.error('Error checking credits:', error);
        // Fallback to direct query
        const { data: directData, error: directError } = await supabase
          .from('user_credits')
          .select('credits_remaining, credits_used, last_reset_at')
          .eq('user_id', user?.id)
          .single();

        if (!directError && directData) {
          setCredits(directData);
        }
      } else if (data && data.length > 0) {
        const creditData = data[0];
        setCredits({
          credits_remaining: creditData.credits_remaining,
          credits_used: creditData.credits_used,
          last_reset_at: new Date().toISOString()
        });
        if (creditData.was_reset) {
          setWasReset(true);
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          role: editUserRole,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditingProfile(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-md">
              <div className="text-yellow-400 font-bold">🪙</div>
              <div className="text-sm font-semibold">{coins}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Profile Header */}
        <section className="glass-card rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/30">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-10 w-10 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-primary" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{editName || profile?.name || 'Student'}</h1>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <p className="text-muted-foreground text-xs mt-1">Role: {editUserRole.charAt(0).toUpperCase() + editUserRole.slice(1)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="gap-2"
            >
              {isEditingProfile ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>

          {/* Edit Profile Section */}
          {isEditingProfile && (
            <div className="pt-6 border-t border-border/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={editUserRole} onValueChange={(v: string) => setEditUserRole(v as 'student' | 'teacher' | 'admin')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full gap-2" variant="neon" onClick={handleSaveProfile}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}
        </section>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-prefs">AI Preferences</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Improvement Tracking Chart */}
            <section className="glass-card rounded-2xl p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Improvement Tracking</h2>
                  <p className="text-sm text-muted-foreground">Your weakness scores over time</p>
                </div>
              </div>
              <ImprovementChart />
            </section>

            {/* Progress Stats */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Study Progress</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{aiStats.notesGenerated}</p>
                  <p className="text-xs text-muted-foreground mt-1">Notes Generated</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                  <p className="text-2xl font-bold text-secondary">{aiStats.aiUsageCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">AI Interactions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-2xl font-bold text-accent">{aiStats.topicsCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Topics Completed</p>
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <section className="glass-card rounded-2xl p-6 space-y-3">
              <h2 className="font-semibold mb-4">Quick Links</h2>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/quiz-history')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Quiz History
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/leaderboard')}
              >
                <Award className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/about')}
              >
                About BrainBuddy
              </Button>
            </section>
          </TabsContent>

          {/* AI Preferences Tab */}
          <TabsContent value="ai-prefs" className="space-y-6">
            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-6 flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                AI Preferences
              </h2>

              <div className="space-y-6">
                {/* Learning Style */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Learning Style</label>
                  <Select
                    value={aiPreferences.learningStyle}
                    onValueChange={(v: string) =>
                      setAiPreferences({ ...aiPreferences, learningStyle: v as 'quick' | 'detailed' | 'exam-focused' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick (Bullet Points)</SelectItem>
                      <SelectItem value="detailed">Detailed (Comprehensive)</SelectItem>
                      <SelectItem value="exam-focused">Exam Focused</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiPreferences.learningStyle === 'quick' &&
                      'BrainBuddy AI will provide concise, point-based summaries.'}
                    {aiPreferences.learningStyle === 'detailed' &&
                      'BrainBuddy AI will provide comprehensive, in-depth explanations.'}
                    {aiPreferences.learningStyle === 'exam-focused' &&
                      'BrainBuddy AI will focus on exam-likely questions and test tips.'}
                  </p>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select
                    value={aiPreferences.difficultyLevel}
                    onValueChange={(v: string) =>
                      setAiPreferences({ ...aiPreferences, difficultyLevel: v as 'beginner' | 'intermediate' | 'advanced' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (Simple)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (Balanced)</SelectItem>
                      <SelectItem value="advanced">Advanced (Deep Dive)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiPreferences.difficultyLevel === 'beginner' &&
                      'Start from basics without complex terminology.'}
                    {aiPreferences.difficultyLevel === 'intermediate' &&
                      'Balance between simplicity and depth.'}
                    {aiPreferences.difficultyLevel === 'advanced' &&
                      'Include advanced concepts and critical analysis.'}
                  </p>
                </div>

                <Button className="w-full" variant="neon">
                  Save Preferences
                </Button>
              </div>
            </section>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Monthly Credits</h2>
                  <p className="text-sm text-muted-foreground">Resets every month</p>
                </div>
              </div>

              {wasReset && (
                <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-primary font-medium">
                    🎉 Your credits have been reset for this month!
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Credits Remaining</span>
                  <span className="text-3xl font-bold neon-text">{credits?.credits_remaining || 0}</span>
                </div>

                <Progress value={100 - ((credits?.credits_used || 0) / TOTAL_MONTHLY_CREDITS) * 100} className="h-3" />

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{credits?.credits_used || 0}</p>
                    <p className="text-sm text-muted-foreground">Credits Used</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{TOTAL_MONTHLY_CREDITS}</p>
                    <p className="text-sm text-muted-foreground">Monthly Limit</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold">
                    Credit Costs:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Find Video: 1 credit</li>
                    <li>• AI Notes: 4 credits</li>
                    <li>• Quiz: 4 credits</li>
                  </ul>
                </div>

                {credits?.last_reset_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
                    <RefreshCw className="h-4 w-4" />
                    <span>Last reset: {new Date(credits.last_reset_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Achievements</h2>
                  <p className="text-sm text-muted-foreground">Unlock badges as you learn</p>
                </div>
              </div>
              <AchievementsPanel />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
