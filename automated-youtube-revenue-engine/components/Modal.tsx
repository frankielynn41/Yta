

import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, AlertCircle, FileText, MessageCircle, RefreshCw, Wand2, Send, ThumbsUp } from 'lucide-react';
import { Video, Comment } from '../types.ts';

interface ModalProps {
  video: Video;
  onClose: () => void;
  isFetchingComments: boolean;
  isReplying: string | null;
  commentError: string | null;
  onFetchComments: (videoId: string) => void;
  onGenerateReply: (commentId: string, commentText: string) => void;
  onPostReply: (parentId: string, replyText: string) => void;
}

const sentimentStyles = {
    Positive: 'bg-green-500/20 text-green-300',
    Negative: 'bg-red-500/20 text-red-300',
    Question: 'bg-blue-500/20 text-blue-300',
    Neutral: 'bg-gray-500/20 text-gray-300',
    Spam: 'bg-yellow-500/20 text-yellow-300',
};

const LoadingSpinner: React.FC<{size?: number}> = ({ size = 5 }) => (
    <svg className={`animate-spin h-${size} w-${size} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const Modal: React.FC<ModalProps> = ({ video, onClose, isFetchingComments, isReplying, commentError, onFetchComments, onGenerateReply, onPostReply }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [editedReplies, setEditedReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);
  
  const handleReplyTextChange = (commentId: string, text: string) => {
      setEditedReplies(prev => ({...prev, [commentId]: text}));
  }

  const renderDetails = () => (
     <>
        {video.status === 'Failed' ? (
             <div>
                <h3 className="font-semibold text-lg text-red-400 mb-2 flex items-center">
                   <AlertCircle className="mr-2" />
                    Video Generation Failed
                </h3>
                <pre className="whitespace-pre-wrap bg-gray-900 p-4 rounded-lg text-red-300 font-mono text-sm overflow-x-auto">
                    <code>{video.description}</code>
                </pre>
            </div>
        ) : (
            <div className="space-y-4 text-gray-300">
                <div>
                    <h3 className="font-semibold text-lg text-indigo-400 mb-2">Script Outline</h3>
                    <ul className="list-disc list-inside space-y-1 bg-gray-800 p-4 rounded-lg">
                        {video.script.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
                {video.tags && video.tags.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg text-indigo-400 mb-2">SEO Tags</h3>
                        <div className="flex flex-wrap gap-2 bg-gray-800 p-4 rounded-lg">
                        {video.tags.map((tag, index) => (
                            <span key={index} className="bg-gray-700 text-gray-300 text-sm font-medium px-2 py-1 rounded-full">
                            {tag}
                            </span>
                        ))}
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-lg text-indigo-400 mb-2">Generated Description</h3>
                    <p className="whitespace-pre-wrap bg-gray-800 p-4 rounded-lg">{video.description}</p>
                </div>
            </div>
        )}
    </>
  );

  const renderComments = () => (
     <div className="space-y-4">
        {commentError && (
             <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
                <p><span className="font-bold">Error:</span> {commentError}</p>
            </div>
        )}
        {!video.commentThreads && !isFetchingComments && (
             <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-white">Manage Comments</h3>
                <p className="mt-1 text-sm text-gray-400">Fetch comments to analyze and reply with AI.</p>
                <button 
                    onClick={() => onFetchComments(video.youtubeVideoId!)}
                    disabled={!video.youtubeVideoId}
                    className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <RefreshCw size={16} className="mr-1"/>
                    Fetch Comments
                </button>
            </div>
        )}
        {isFetchingComments && <div className="flex justify-center items-center py-16"><LoadingSpinner size={8}/></div>}
        {video.commentThreads && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-4">
                {video.commentThreads.length === 0 ? (
                     <p className="text-center py-8 text-gray-400">No comments found for this video yet.</p>
                ) : video.commentThreads.map((comment) => (
                     <div key={comment.id} className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                           <a href={comment.author.channelUrl} target="_blank" rel="noopener noreferrer">
                             <img src={comment.author.imageUrl} alt={comment.author.name} className="w-10 h-10 rounded-full"/>
                           </a>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                   <a href={comment.author.channelUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:underline">{comment.author.name}</a>
                                    <span className="text-xs text-gray-500">{new Date(comment.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: comment.text }}></p>
                                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1"><ThumbsUp size={12}/> {comment.likeCount}</div>
                            </div>
                        </div>
                        <div className="mt-3 pl-[52px]">
                            {isReplying === comment.id && <div className="flex items-center gap-2 text-sm text-indigo-300"><LoadingSpinner size={4}/><span>Analyzing & Responding...</span></div>}
                            
                            {!isReplying && !comment.aiAnalysis && !comment.replyPosted && (
                                <button onClick={() => onGenerateReply(comment.id, comment.text)} disabled={!!isReplying} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                                    <Wand2 size={16}/> Generate Reply
                                </button>
                            )}
                            
                            {comment.aiAnalysis && !comment.replyPosted && !isReplying && (
                                <div className="space-y-2">
                                    <div className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${sentimentStyles[comment.aiAnalysis.sentiment]}`}>{comment.aiAnalysis.sentiment}</div>
                                    <textarea
                                        value={editedReplies[comment.id] ?? comment.aiAnalysis.suggestedReply}
                                        onChange={(e) => handleReplyTextChange(comment.id, e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                        rows={3}
                                    />
                                    <button
                                        onClick={() => onPostReply(comment.id, editedReplies[comment.id] ?? comment.aiAnalysis.suggestedReply)}
                                        disabled={!!isReplying}
                                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-1.5 px-3 rounded-lg text-sm transition-colors"
                                    >
                                        <Send size={14}/> Post Reply
                                    </button>
                                </div>
                            )}

                            {comment.replyPosted && <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">✓ Reply Posted</div>}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in-90 slide-in-from-bottom-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-4">
                <h2 id="modal-title" className="text-2xl font-bold text-white max-w-xl truncate">{video.title}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50 -mt-2 -mr-2"
                    aria-label="Close modal"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="border-b border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('details')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`}>
                  <FileText size={16} /> Details
                </button>
                 <button onClick={() => setActiveTab('comments')} disabled={video.status !== 'Uploaded'} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors disabled:text-gray-600 disabled:cursor-not-allowed ${activeTab === 'comments' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`}>
                  <MessageCircle size={16} /> Comment Manager
                </button>
              </nav>
            </div>
            
            <div className="min-h-[200px]">
                {activeTab === 'details' ? renderDetails() : renderComments()}
            </div>
        </div>
      </div>
    </div>
  );
};