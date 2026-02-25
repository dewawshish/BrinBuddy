import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Save,
  LogOut,
  TrendingUp,
  BookOpen,
  Brain,
  Zap,
  User,
  Mail,
  GraduationCap,
  Target,
  Loader2,
  AlertCircle,
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { useAI } from '@/contexts/AIContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Teacher' | 'Admin';
  class: string;
  stream?: string;
  targetExams?: string;
  avatar?: string;
  bio?: string;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { aiProfile, updateAIProfile } = useAI();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UserProfile | null>(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Load from existing profiles table
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const profileData: UserProfile = {
          id: data.id || user.id,
          name: data.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'Student', // Default role
          class: '', // Will be stored in custom table
          stream: undefined,
          targetExams: undefined,
          avatar: data.avatar_url,
          bio: undefined,
        };
        setProfile(profileData);
        setFormData(profileData);
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'Student',
          class: '',
        };
        setProfile(defaultProfile);
        setFormData(defaultProfile);
      }
    } catch (_error) {
      console.error('Error loading profile:', _error);
      // Create default profile on error
      const defaultProfile: UserProfile = {
        id: user?.id || '',
        name: user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        role: 'Student',
        class: '',
      };
      setProfile(defaultProfile);
      setFormData(defaultProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData) return;

    try {
      setIsSaving(true);

      // Save only to the existing profiles table with available fields
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (_error) {
      console.error('Error saving profile:', _error);
      toast.error(_error instanceof Error ? _error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:ml-64 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <User className="h-8 w-8 text-primary" />
                My Profile
              </h1>
              <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* User Details Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing && formData ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">Full Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">Role</label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, role: value as 'Student' | 'Teacher' | 'Admin' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">👨‍🎓 Student</SelectItem>
                        <SelectItem value="Teacher">👨‍🏫 Teacher</SelectItem>
                        <SelectItem value="Admin">⚙️ Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">Class / Grade</label>
                    <Select
                      value={formData.class}
                      onValueChange={(value) =>
                        setFormData({ ...formData, class: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i + 1} value={`Class ${i + 1}`}>
                            Class {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">Stream (optional)</label>
                    <Select
                      value={formData.stream || ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, stream: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stream" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Science">🔬 Science</SelectItem>
                        <SelectItem value="Commerce">💼 Commerce</SelectItem>
                        <SelectItem value="Arts">📚 Arts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      Target Exams (optional)
                    </label>
                    <Input
                      value={formData.targetExams || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetExams: e.target.value || undefined,
                        })
                      }
                      placeholder="e.g., JEE, NEET, UPSC, Board Exams"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">Bio (optional)</label>
                    <Textarea
                      value={formData.bio || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value || undefined })
                      }
                      placeholder="Tell us a bit about yourself"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setFormData(profile);
                        setIsEditing(false);
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-semibold">{profile.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="font-semibold">{profile.role}</p>
                    </div>
                  </div>

                  {profile.class && (
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Class</p>
                        <p className="font-semibold">
                          {profile.class}
                          {profile.stream && ` - ${profile.stream}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.targetExams && (
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Target Exams</p>
                        <p className="font-semibold">{profile.targetExams}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Preferences */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Preferences
              </CardTitle>
              <CardDescription>
                Customize how BrainBuddy AI responds to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-3">Learning Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'quick', label: '⚡ Quick', desc: 'Concise & Fast' },
                    { value: 'detailed', label: '📖 Detailed', desc: 'Thorough' },
                    {
                      value: 'exam-focused',
                      label: '🎯 Exam',
                      desc: 'Focused',
                    },
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() =>
                        updateAIProfile({
                          learningStyle: style.value as 'quick' | 'detailed' | 'exam-focused',
                        })
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        aiProfile?.learningStyle === style.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">{style.label}</p>
                      <p className="text-xs text-muted-foreground">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'beginner', label: '🌱 Beginner', desc: 'Basics' },
                    { value: 'intermediate', label: '📚 Inter', desc: 'Standard' },
                    { value: 'advanced', label: '🚀 Advanced', desc: 'Challenging' },
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() =>
                        updateAIProfile({
                          difficultyLevel: level.value as 'beginner' | 'intermediate' | 'advanced',
                        })
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        aiProfile?.difficultyLevel === level.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">{level.label}</p>
                      <p className="text-xs text-muted-foreground">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
              <CardDescription>Stats and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Notes Generated</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {aiProfile?.aiUsageStats.notesGenerated || 0}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Doubts Resolved</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {aiProfile?.aiUsageStats.doubtsResolved || 0}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Topics Completed</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {aiProfile?.topicsCompleted.length || 0}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Characters</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      (aiProfile?.aiUsageStats.charactersUsed || 0) / 1000
                    )}K
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="glass-card border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You can log back in anytime with your credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
