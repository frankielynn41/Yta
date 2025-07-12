
export type View = 'Dashboard' | 'Videos' | 'Analytics' | 'Strategy' | 'Settings';

export interface CommentAuthor {
  name: string;
  imageUrl: string;
  channelUrl: string;
}

export interface AIAnalysis {
    sentiment: 'Positive' | 'Negative' | 'Question' | 'Neutral' | 'Spam';
    suggestedReply: string;
}

export interface Comment {
  id: string;
  text: string;
  author: CommentAuthor;
  publishedAt: string;
  likeCount: number;
  aiAnalysis?: AIAnalysis;
  replyPosted?: boolean;
}

export interface Video {
  id: string;
  youtubeVideoId?: string;
  title: string;
  script: string[];
  description:string;
  tags: string[];
  uploadDate: string;
  views: number;
  likes: number;
  comments: number;
  status: 'Uploaded' | 'Processing' | 'Generated' | 'Uploading' | 'Failed';
  thumbnail: string;
  commentThreads?: Comment[];
}

export interface Stats {
  name: string; // e.g., 'Day 1'
  views: number;
  videos: number;
  likes: number;
  comments: number;
}

export interface YouTubeState {
  connected: boolean;
  channelName: string | null;
  channelImage: string | null;
  accessToken: string | null;
  error: string | null;
  videoCount: number | null;
}

export interface StrategyIdea {
  title: string;
  concept: string;
  reason: string;
}

export interface AppState {
  activeView: View;
  isAutomated: boolean;
  isGenerating: boolean;
  isConnecting: boolean;
  statsHistory: Stats[];
  videos: Video[];
  selectedVideo: Video | null;
  youtube: YouTubeState;
  videoTopic: string;
  isFetchingComments: boolean;
  isReplying: string | null; // Holds the ID of the comment being processed
  commentError: string | null;
  lastAutomationTimestamp: number | null;
  // New state for Content Strategy Planner
  isGeneratingStrategy: boolean;
  strategyNiche: string;
  strategyIdeas: StrategyIdea[];
}
