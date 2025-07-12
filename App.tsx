

import React from 'react';
import { useYouTubeAutomation } from './hooks/useYouTubeAutomation.ts';
import Sidebar from './components/Sidebar.tsx';
import StatCard from './components/StatCard.tsx';
import VideoDataTable from './components/VideoDataTable.tsx';
import SettingsView from './components/SettingsView.tsx';
import { Modal } from './components/Modal.tsx';
import { Eye, Video, ThumbsUp, MessageSquare, Settings, BarChart2, Zap } from 'lucide-react';
import AnalyticsChart from './components/AnalyticsChart.tsx';
import StrategyPlannerView from './components/StrategyPlannerView.tsx';

const App: React.FC = () => {
    const {
        state,
        toggleAutomation,
        generateAndAddVideo,
        setActiveView,
        setSelectedVideo,
        fetchYouTubeStats,
        handleConnectSuccess,
        handleConnectError,
        handleDisconnect,
        setVideoTopic,
        fetchCommentsForVideo,
        generateReplySuggestion,
        postYouTubeReply,
        setStrategyNiche,
        generateContentStrategy,
        selectStrategyIdea,
    } = useYouTubeAutomation();

    const {
        activeView,
        isAutomated,
        isGenerating,
        isConnecting,
        statsHistory,
        videos,
        selectedVideo,
        youtube,
        videoTopic,
        isFetchingComments,
        isReplying,
        commentError,
        strategyNiche,
        strategyIdeas,
        isGeneratingStrategy,
    } = state;

    const latestStats = statsHistory.length > 0 ? statsHistory[statsHistory.length - 1] : { views: 0, likes: 0, comments: 0, videos: 0, name: 'Current' };
    const prevStats = statsHistory.length > 1 ? statsHistory[statsHistory.length - 2] : { views: 0, likes: 0, comments: 0, videos: 0, name: 'Previous' };

    const renderView = () => {
        switch (activeView) {
            case 'Dashboard':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard icon={<Eye className="h-8 w-8 text-blue-400" />} title="Total Views" value={latestStats.views.toLocaleString()} change={latestStats.views - prevStats.views} />
                            <StatCard icon={<Video className="h-8 w-8 text-green-400" />} title="Videos Uploaded" value={latestStats.videos.toLocaleString()} change={latestStats.videos - prevStats.videos} />
                            <StatCard icon={<ThumbsUp className="h-8 w-8 text-pink-400" />} title="Total Likes" value={latestStats.likes.toLocaleString()} change={latestStats.likes - prevStats.likes} />
                            <StatCard icon={<MessageSquare className="h-8 w-8 text-teal-400" />} title="Total Comments" value={latestStats.comments.toLocaleString()} change={latestStats.comments - prevStats.comments} />
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                            <h2 className="text-2xl font-bold flex items-center mb-4">
                                <Zap className="mr-3 text-indigo-400"/>
                                Video Idea Generator
                            </h2>
                            <p className="text-gray-400 mb-4">Enter a topic below and let our AI create the next viral video for your channel.</p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <input
                                    type="text"
                                    value={videoTopic}
                                    onChange={(e) => setVideoTopic(e.target.value)}
                                    placeholder="e.g., 'Unbelievable space facts'"
                                    className="flex-grow w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    disabled={isGenerating || !youtube.connected}
                                />
                                <button
                                    onClick={() => generateAndAddVideo()}
                                    disabled={isGenerating || !youtube.connected || !videoTopic.trim()}
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30 flex items-center justify-center"
                                    title={!youtube.connected ? "Connect your YouTube channel in Settings to generate videos" : !videoTopic.trim() ? "Please enter a video topic" : "Generate video"}
                                >
                                    {isGenerating ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                         <Zap size={18} className="mr-2"/>
                                         Generate Video
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold flex items-center">
                                    <BarChart2 className="mr-3 text-indigo-400"/>
                                    Performance Overview
                                </h2>
                                <button onClick={() => fetchYouTubeStats()} disabled={!youtube.connected || isGenerating} className="text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-lg transition-colors">
                                    Refresh Stats
                                </button>
                            </div>
                            <div className="h-80">
                                <AnalyticsChart 
                                    data={statsHistory} 
                                    metric="views"
                                    strokeColor="#4f46e5"
                                    gradientFromColor="rgba(79, 70, 229, 0.4)"
                                    gradientToColor="rgba(79, 70, 229, 0)"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'Videos':
                return <VideoDataTable videos={videos} onSelectVideo={setSelectedVideo} />;
            case 'Analytics':
                 return (
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold text-white">Detailed Analytics</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 h-96">
                                <AnalyticsChart 
                                    data={statsHistory} 
                                    metric="views"
                                    title="Views Over Time"
                                    strokeColor="#4f46e5"
                                    gradientFromColor="rgba(79, 70, 229, 0.4)"
                                    gradientToColor="rgba(79, 70, 229, 0)"
                                />
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 h-96">
                                 <AnalyticsChart 
                                    data={statsHistory} 
                                    metric="likes"
                                    title="Likes Over Time"
                                    strokeColor="#ec4899"
                                    gradientFromColor="rgba(236, 72, 153, 0.4)"
                                    gradientToColor="rgba(236, 72, 153, 0)"
                                />
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 h-96">
                                 <AnalyticsChart 
                                    data={statsHistory} 
                                    metric="comments"
                                    title="Comments Over Time"
                                    strokeColor="#2dd4bf"
                                    gradientFromColor="rgba(45, 212, 191, 0.4)"
                                    gradientToColor="rgba(45, 212, 191, 0)"
                                />
                            </div>
                             <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 h-96">
                                 <AnalyticsChart 
                                    data={statsHistory} 
                                    metric="videos"
                                    title="Videos Uploaded Over Time"
                                    strokeColor="#38bdf8"
                                    gradientFromColor="rgba(56, 189, 248, 0.4)"
                                    gradientToColor="rgba(56, 189, 248, 0)"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'Strategy':
                return (
                    <StrategyPlannerView
                        strategyNiche={strategyNiche}
                        strategyIdeas={strategyIdeas}
                        isGenerating={isGeneratingStrategy}
                        onNicheChange={setStrategyNiche}
                        onGenerate={generateContentStrategy}
                        onSelectIdea={selectStrategyIdea}
                        isYouTubeConnected={youtube.connected}
                    />
                );
            case 'Settings':
                return (
                     <SettingsView
                        isAutomated={isAutomated}
                        isConnecting={isConnecting}
                        toggleAutomation={toggleAutomation}
                        youtubeState={youtube}
                        onConnectSuccess={handleConnectSuccess}
                        onConnectError={handleConnectError}
                        onDisconnect={handleDisconnect}
                     />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar activeView={activeView} setActiveView={setActiveView} isYouTubeConnected={youtube.connected} />
            <main className="flex-1 p-8 overflow-y-auto">
                {renderView()}
            </main>
            {selectedVideo && (
                <Modal 
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    isFetchingComments={isFetchingComments}
                    isReplying={isReplying}
                    commentError={commentError}
                    onFetchComments={fetchCommentsForVideo}
                    onGenerateReply={generateReplySuggestion}
                    onPostReply={postYouTubeReply}
                />
            )}
        </div>
    );
};

export default App;