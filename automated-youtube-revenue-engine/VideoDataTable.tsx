

import React from 'react';
import { Video } from '../types.ts';
import { Eye, ExternalLink } from 'lucide-react';

interface VideoDataTableProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
}

const StatusBadge: React.FC<{ status: Video['status'] }> = ({ status }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap";
    const statusClasses = {
        Uploaded: "bg-green-500/20 text-green-300",
        Processing: "bg-yellow-500/20 text-yellow-300 animate-pulse",
        Generated: "bg-blue-500/20 text-blue-300",
        Uploading: "bg-purple-500/20 text-purple-300 animate-pulse",
        Failed: "bg-red-500/20 text-red-300",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>
}

const VideoDataTable: React.FC<VideoDataTableProps> = ({ videos, onSelectVideo }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-6">
            <h2 className="text-2xl font-bold">Video Library</h2>
            <p className="text-gray-400 mt-1">Manage and review all your generated and uploaded videos.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/50">
                <tr>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase"></th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase">Title</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase text-right">Views</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase text-right">Likes</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase text-right">Comments</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-300 uppercase">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                {videos.length === 0 && (
                    <tr>
                        <td colSpan={8} className="text-center py-16 text-gray-400">
                            No videos found. Connect your YouTube channel or generate a new video.
                        </td>
                    </tr>
                )}
                {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                        <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-md bg-gray-700" />
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                        <p className="font-medium text-white truncate" title={video.title}>{video.title}</p>
                    </td>
                    <td className="px-6 py-4">
                        <StatusBadge status={video.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-right">{video.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-300 text-right">{video.likes.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-300 text-right">{video.comments.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(video.uploadDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => onSelectVideo(video)} className="text-indigo-400 hover:text-indigo-300 p-2 rounded-md hover:bg-gray-700" title="View Details">
                               <Eye size={18} />
                            </button>
                            {video.youtubeVideoId && (
                                <a 
                                    href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700 inline-block"
                                    title="View on YouTube"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            )}
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default VideoDataTable;