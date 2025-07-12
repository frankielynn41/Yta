

import React from 'react';
import { StrategyIdea } from '../types.ts';
import { Lightbulb, Wand2, Zap, BrainCircuit } from 'lucide-react';

interface StrategyPlannerViewProps {
    strategyNiche: string;
    strategyIdeas: StrategyIdea[];
    isGenerating: boolean;
    onNicheChange: (niche: string) => void;
    onGenerate: () => void;
    onSelectIdea: (idea: StrategyIdea) => void;
    isYouTubeConnected: boolean;
}

const LoadingSpinner: React.FC<{size?: number}> = ({ size = 5 }) => (
    <svg className={`animate-spin h-${size} w-${size} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const StrategyPlannerView: React.FC<StrategyPlannerViewProps> = ({
    strategyNiche,
    strategyIdeas,
    isGenerating,
    onNicheChange,
    onGenerate,
    onSelectIdea,
    isYouTubeConnected
}) => {
    return (
        <div className="space-y-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h2 className="text-2xl font-bold flex items-center mb-2">
                    <Lightbulb className="mr-3 text-indigo-400"/>
                    Content Strategy Planner
                </h2>
                <p className="text-gray-400 mb-6">Let AI generate a week's worth of viral video ideas for your channel.</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                        type="text"
                        value={strategyNiche}
                        onChange={(e) => onNicheChange(e.target.value)}
                        placeholder="e.g., 'Quick vegan recipes', 'Space exploration facts'"
                        className="flex-grow w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        disabled={isGenerating || !isYouTubeConnected}
                    />
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating || !isYouTubeConnected || !strategyNiche.trim()}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30 flex items-center justify-center"
                        title={!isYouTubeConnected ? "Connect your YouTube channel in Settings first" : !strategyNiche.trim() ? "Please enter a channel niche" : "Generate Strategy"}
                    >
                        {isGenerating ? (
                            <>
                                <LoadingSpinner size={5} />
                                <span className="ml-2">Generating...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 size={18} className="mr-2"/>
                                Generate Strategy
                            </>
                        )}
                    </button>
                </div>
                 {!isYouTubeConnected && (
                    <div className="mt-4 text-sm text-yellow-400/80 bg-yellow-900/30 p-3 rounded-lg">
                        <strong>Note:</strong> You must connect your YouTube channel before you can generate a content strategy.
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {isGenerating && (
                    <div className="text-center py-16">
                         <LoadingSpinner size={8}/>
                         <p className="mt-4 text-lg text-gray-300">Building your content strategy...</p>
                    </div>
                )}
                {!isGenerating && strategyIdeas.length === 0 && (
                    <div className="text-center py-16 bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-700">
                        <BrainCircuit size={48} className="mx-auto text-gray-600" />
                        <h3 className="mt-4 text-xl font-semibold text-white">Your Strategy Awaits</h3>
                        <p className="mt-2 text-gray-400">Enter your channel's niche above and click "Generate Strategy" to get started.</p>
                    </div>
                )}
                {!isGenerating && strategyIdeas.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {strategyIdeas.map((idea, index) => (
                            <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col justify-between transform transition-all duration-300 hover:scale-105 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-600/20">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-lg text-white mb-2">{idea.title}</h3>
                                    <p className="text-sm text-gray-300 mb-4">{idea.concept}</p>
                                    <div className="bg-gray-900/50 p-3 rounded-lg">
                                        <p className="text-sm font-semibold text-indigo-300">Why it works:</p>
                                        <p className="text-xs text-gray-400 mt-1">{idea.reason}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onSelectIdea(idea)}
                                    className="w-full mt-6 bg-gray-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Zap size={16}/>
                                    Generate this Video
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategyPlannerView;