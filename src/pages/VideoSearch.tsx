import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Play, Loader2, Search, AlertCircle, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { youtubeService, YouTubeVideo } from '@/services/youtubeService';
import Sidebar from '@/components/Sidebar';

// Simple debounce utility - pure function
function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const VideoSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  // Create the debounced search function with useRef for stable reference
  const performSearchRef = useRef<(query: string) => void>();

  useMemo(() => {
    performSearchRef.current = createDebounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setVideos([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const refinedQuery = youtubeService.refineSearchQuery(searchQuery);
        const results = await youtubeService.search(refinedQuery, 15);
        setVideos(results);

        if (results.length === 0) {
          toast.info('No videos found for that query');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to search videos';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const performSearch = useCallback((searchQuery: string) => {
    performSearchRef.current?.(searchQuery);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    performSearch(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:ml-64 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Play className="h-8 w-8 text-red-500" />
              Video Search
            </h1>
            <p className="text-muted-foreground">
              Search YouTube to find the best educational videos for your topic
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 glass-card">
            <CardHeader>
              <CardTitle>Search Videos</CardTitle>
              <CardDescription>
                Enter a topic to find relevant YouTube videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search topic (e.g., Python loops, Electromagnetics, U.S. History)"
                  value={query}
                  onChange={handleSearchChange}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !query.trim()} className="flex-shrink-0">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="mb-8 bg-destructive/10 border-destructive/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-1">Search Error</h3>
                    <p className="text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Layout */}
          {selectedVideo ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player (2 cols) */}
              <div className="lg:col-span-2">
                <Card className="glass-card overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{selectedVideo.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {selectedVideo.channelTitle}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedVideo(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video mb-4">
                      <iframe
                        className="w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                        title={selectedVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {selectedVideo.description}
                        </p>
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Watch on YouTube
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Video List (1 col) */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold mb-4">Results ({videos.length})</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-4">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className={`cursor-pointer transition-colors glass-card group ${
                        selectedVideo?.id === video.id
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-3">
                          <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded-l-lg bg-muted">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 p-3 flex flex-col justify-between">
                            <h4 className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {video.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {video.channelTitle}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Grid View */}
              {videos.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-6">
                    Results ({videos.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <Card
                        key={video.id}
                        className="glass-card overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">{video.channelTitle}</p>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVideo(video);
                            }}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && videos.length === 0 && !error && (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    {query ? 'No videos found. Try a different search.' : 'Enter a topic to search for videos'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSearch;
