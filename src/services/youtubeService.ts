/**
 * YouTube Integration Service
 * Handles video search, playback, and window player functionality
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
}

export interface YouTubeWindow {
  id: string;
  videoId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyDJouqzFgkHPtva3-ehBHtXmGzpSebouUE';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeService {
  private openWindows: Map<string, YouTubeWindow> = new Map();

  /**
   * Search for educational videos on YouTube
   */
  async searchVideos(query: string, maxResults: number = 12): Promise<YouTubeVideo[]> {
    try {
      if (!YOUTUBE_API_KEY) {
        console.warn('YouTube API key not configured');
        return this.getMockVideos(query);
      }

      const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
      searchUrl.searchParams.set('q', query);
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
      searchUrl.searchParams.set('maxResults', maxResults.toString());
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('relevanceLanguage', 'en');
      searchUrl.searchParams.set('videoEmbeddable', 'true');

      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        console.error('YouTube API error:', response.status, response.statusText);
        return this.getMockVideos(query);
      }

      const data = await response.json();

      if (!data.items?.length) {
        console.warn('No videos found from YouTube API');
        return this.getMockVideos(query);
      }

      return data.items.map((item: Record<string, unknown>): YouTubeVideo => {
        const id = item.id as Record<string, unknown>;
        const snippet = item.snippet as Record<string, unknown>;
        const thumbnails = snippet?.thumbnails as Record<string, Record<string, unknown>>;
        const mediumUrl = (thumbnails?.medium as Record<string, unknown>)?.url as string;
        const defaultUrl = (thumbnails?.default as Record<string, unknown>)?.url as string;

        return {
          id: (id?.videoId as string) || (item.id as string),
          title: (snippet?.title as string) || 'Untitled Video',
          description: (snippet?.description as string) || '',
          thumbnail: mediumUrl || defaultUrl || '',
          channelTitle: (snippet?.channelTitle as string) || 'Unknown Channel',
          publishedAt: (snippet?.publishedAt as string) || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return this.getMockVideos(query);
    }
  }

  /**
   * Get mock videos for development/fallback
   */
  private getMockVideos(query: string): YouTubeVideo[] {
    const mockVideos: YouTubeVideo[] = [
      {
        id: 'dQw4w9WgXcQ',
        title: `${query} - Complete Tutorial`,
        description: `Learn everything about ${query}`,
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        channelTitle: 'Educational Channel',
        publishedAt: new Date().toISOString(),
      },
      {
        id: 'jNQXAC9IVRw',
        title: `${query} - Explained Simply`,
        description: `Simple explanation of ${query}`,
        thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
        channelTitle: 'Learn with Me',
        publishedAt: new Date().toISOString(),
      },
      {
        id: '9bZkp7q19f0',
        title: `${query} - Full Course`,
        description: `Complete course on ${query}`,
        thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
        channelTitle: 'Pro Academy',
        publishedAt: new Date().toISOString(),
      },
    ];
    return mockVideos;
  }

  /**
   * Get detailed video information
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const url = new URL(`${YOUTUBE_API_BASE}/videos`);
      url.searchParams.set('id', videoId);
      url.searchParams.set('key', YOUTUBE_API_KEY);
      url.searchParams.set('part', 'snippet,statistics,contentDetails');

      const response = await fetch(url.toString());
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.items || data.items.length === 0) return null;

      const item = data.items[0];
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails?.duration,
        viewCount: item.statistics?.viewCount
          ? parseInt(item.statistics.viewCount)
          : undefined,
        likeCount: item.statistics?.likeCount
          ? parseInt(item.statistics.likeCount)
          : undefined,
      };
    } catch (error) {
      console.error('Error getting video details:', error);
      return null;
    }
  }

  /**
   * Search videos for a specific subject and chapter
   */
  searchEducationalVideos(subject: string, chapter: string): Promise<YouTubeVideo[]> {
    const query = `${subject} ${chapter} tutorial educational`;
    return this.searchVideos(query, 20);
  }

  /**
   * Open a video in a floating window
   */
  openVideoWindow(videoId: string, title: string): string {
    const windowId = `window-${Date.now()}`;
    const newWindow: YouTubeWindow = {
      id: windowId,
      videoId,
      title,
      x: 100,
      y: 100,
      width: 560,
      height: 315,
      isMinimized: false,
    };

    this.openWindows.set(windowId, newWindow);
    return windowId;
  }

  /**
   * Update window position and size
   */
  updateWindowPosition(
    windowId: string,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    const window = this.openWindows.get(windowId);
    if (window) {
      window.x = x;
      window.y = y;
      if (width) window.width = width;
      if (height) window.height = height;
    }
  }

  /**
   * Toggle window minimized state
   */
  toggleWindowMinimized(windowId: string): void {
    const window = this.openWindows.get(windowId);
    if (window) {
      window.isMinimized = !window.isMinimized;
    }
  }

  /**
   * Close a video window
   */
  closeWindow(windowId: string): void {
    this.openWindows.delete(windowId);
  }

  /**
   * Get all open windows
   */
  getOpenWindows(): YouTubeWindow[] {
    return Array.from(this.openWindows.values());
  }

  /**
   * Get a specific window
   */
  getWindow(windowId: string): YouTubeWindow | undefined {
    return this.openWindows.get(windowId);
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    this.openWindows.clear();
  }

  /**
   * Generate YouTube embed URL
   */
  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }

  /**
   * Generate YouTube watch URL
   */
  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Refine search query for better results
   */
  refineSearchQuery(query: string): string {
    // Add educational context if not present
    if (!query.toLowerCase().includes('tutorial') && 
        !query.toLowerCase().includes('explained') &&
        !query.toLowerCase().includes('course')) {
      return `${query} tutorial explained for beginners`;
    }
    return query;
  }

  /**
   * Search videos (alias for searchVideos)
   */
  search(query: string, maxResults?: number): Promise<YouTubeVideo[]> {
    return this.searchVideos(query, maxResults);
  }
}

export const youtubeService = new YouTubeService();
