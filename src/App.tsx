import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { CoinProvider } from "@/contexts/CoinContext";
import { AIProvider } from "@/contexts/AIContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import VideoPlayer from "./pages/VideoPlayer";
import Notes from "./pages/Notes";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import EnhancedProfile from "./pages/EnhancedProfile";
import QuizHistory from "./pages/QuizHistory";
import Leaderboard from "./pages/Leaderboard";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import FixWeakAreas from "./pages/FixWeakAreas";
import Analysis from "./pages/Analysis";
import Friends from "./pages/Friends";
import Games from "./pages/Games";
import GamePlayer from "./pages/GamePlayer";
import BrainBuddyAI from "./pages/BrainBuddyAI";
import NotesGenerator from "./pages/NotesGenerator";
import VideoSearch from "./pages/VideoSearch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FilterProvider>
        <TooltipProvider>
          <AIProvider>
            <Toaster />
            <Sonner 
              position="top-center"
              toastOptions={{
                classNames: {
                  toast: 'glass-card border-border',
                  title: 'text-foreground',
                  description: 'text-muted-foreground',
                },
              }}
            />
            <CoinProvider>
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:todoId"
              element={
                <ProtectedRoute>
                  <VideoPlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes/:todoId"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:quizId"
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-profile"
              element={
                <ProtectedRoute>
                  <EnhancedProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai"
              element={
                <ProtectedRoute>
                  <BrainBuddyAI />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes-generator"
              element={
                <ProtectedRoute>
                  <NotesGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-search"
              element={
                <ProtectedRoute>
                  <VideoSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz-history"
              element={
                <ProtectedRoute>
                  <QuizHistory />
                </ProtectedRoute>
              }
              />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fix-weak-areas"
              element={
                <ProtectedRoute>
                  <FixWeakAreas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis"
              element={
                <ProtectedRoute>
                  <Analysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <Games />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/:gameId"
              element={
                <ProtectedRoute>
                  <GamePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </CoinProvider>
            </AIProvider>
        </TooltipProvider>
      </FilterProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
