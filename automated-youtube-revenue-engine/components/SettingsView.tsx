

import React from 'react';
import { YouTubeState } from '../types.ts';
import Toggle from './Toggle.tsx';
import { Youtube, Power, PowerOff } from 'lucide-react';
import { useGoogleLogin, googleLogout, TokenResponse } from '@react-oauth/google';

interface SettingsViewProps {
  isAutomated: boolean;
  isConnecting: boolean;
  toggleAutomation: () => void;
  youtubeState: YouTubeState;
  onConnectSuccess: (tokenResponse: Pick<TokenResponse, 'access_token'>) => void;
  onConnectError: (error: any) => void;
  onDisconnect: () => void;
}

interface YouTubeConnectProps {
    isConnecting: boolean;
    onConnectSuccess: (tokenResponse: Pick<TokenResponse, 'access_token'>) => void;
    onConnectError: (error: any) => void;
}

// This new component isolates the useGoogleLogin hook call.
const YouTubeConnect: React.FC<YouTubeConnectProps> = ({ isConnecting, onConnectSuccess, onConnectError }) => {
    const login = useGoogleLogin({
        onSuccess: onConnectSuccess,
        onError: onConnectError,
        scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
    });

    return (
        <>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Enable automated video generation and uploading by connecting your YouTube account.
            </p>
            <button
                onClick={() => login()}
                disabled={isConnecting}
                className="w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800/50 disabled:cursor-wait text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
            >
                {isConnecting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                    </>
                ) : (
                    <>
                       <Youtube size={20} className="mr-2"/>
                       Connect YouTube Channel
                    </>
                )}
            </button>
        </>
    );
};


const SettingsView: React.FC<SettingsViewProps> = ({
  isAutomated,
  isConnecting,
  toggleAutomation,
  youtubeState,
  onConnectSuccess,
  onConnectError,
  onDisconnect,
}) => {

  const handleDisconnectClick = () => {
    googleLogout();
    onDisconnect();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Youtube className="mr-3 text-red-500"/>
            YouTube Channel Connection
        </h2>

        {youtubeState.connected ? (
            <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                    <img src={youtubeState.channelImage!} alt={youtubeState.channelName!} className="w-16 h-16 rounded-full" />
                    <div>
                        <p className="font-bold text-lg text-white">{youtubeState.channelName}</p>
                        <p className="text-sm text-green-400">Connected</p>
                    </div>
                </div>
                <button
                    onClick={handleDisconnectClick}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <PowerOff size={18} />
                    Disconnect
                </button>
            </div>
        ) : (
            <div className="text-center">
                {youtubeState.error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
                        <p className="font-bold">Connection Failed</p>
                        <p>{youtubeState.error}</p>
                    </div>
                )}
                
                <YouTubeConnect 
                    isConnecting={isConnecting}
                    onConnectSuccess={onConnectSuccess}
                    onConnectError={onConnectError}
                />
            </div>
        )}
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Power className="mr-3 text-indigo-400"/>
            Automation Control
        </h2>
         <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-white">Enable Autopilot Mode</p>
                <p className="text-sm text-gray-400">
                    {isAutomated 
                        ? "The engine will automatically generate and upload two videos per hour." 
                        : "Turn on to let the system run completely on its own."
                    }
                </p>
            </div>
             <Toggle enabled={isAutomated} onToggle={toggleAutomation} disabled={!youtubeState.connected} />
        </div>
        {!youtubeState.connected && (
            <div className="mt-4 text-sm text-yellow-400/80 bg-yellow-900/30 p-3 rounded-lg">
                <strong>Note:</strong> You must connect your YouTube channel before you can enable Autopilot mode.
            </div>
        )}
      </div>

    </div>
  );
};

export default SettingsView;