import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import BrainBuddyAIPanel from '@/components/BrainBuddyAIPanel';

const AIPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:ml-64 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              BrainBuddy AI
            </h1>
            <p className="text-muted-foreground mt-2">
              Chat with your AI study companion for notes, doubts, and exam help
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generate Notes Instantly
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get comprehensive study notes for any topic with structured sections for maximum learning efficiency.
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Resolve Your Doubts
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Ask any question and get detailed, easy-to-understand answers tailored to your learning style.
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Exam Preparation Help
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get focused preparation strategies and practice tips for your target exams.
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Personalized Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                AI adapts to your preferred learning style, difficulty level, and pace.
              </CardContent>
            </Card>
          </div>

          {/* AI Panel */}
          <div className="rounded-lg overflow-hidden border border-border/50">
            <BrainBuddyAIPanel isOpen={true} compact={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
