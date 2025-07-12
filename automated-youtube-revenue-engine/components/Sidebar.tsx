

import React from 'react';
import { View } from '../types.ts';
import { LayoutDashboard, Video, BarChart3, Settings, Youtube, Lightbulb } from 'lucide-react';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isYouTubeConnected: boolean;
}

const navItems = [
  { name: 'Dashboard' as View, icon: LayoutDashboard },
  { name: 'Videos' as View, icon: Video },
  { name: 'Analytics' as View, icon: BarChart3 },
  { name: 'Strategy' as View, icon: Lightbulb },
  { name: 'Settings' as View, icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isYouTubeConnected }) => {
  return (
    <aside className="w-64 bg-gray-900/70 backdrop-blur-lg border-r border-gray-700/50 flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <Youtube className="h-10 w-10 text-red-500" />
        <h1 className="text-xl font-bold text-white">
            Revenue Engine
        </h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveView(item.name)}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left text-base font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              {item.name === 'Settings' && !isYouTubeConnected && (
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white">Go Pro</h3>
        <p className="text-sm text-gray-400 mt-1 mb-3">Unlock advanced analytics and unlimited video generation.</p>
        <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
          Upgrade Now
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;