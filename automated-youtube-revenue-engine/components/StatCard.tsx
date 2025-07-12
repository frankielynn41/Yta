

import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change }) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 flex flex-col justify-between transform transition-all duration-300 hover:scale-105 hover:bg-gray-800">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-400">{title}</h3>
            {icon}
        </div>
        <div className="mt-4">
            <p className="text-4xl font-bold text-white">{value}</p>
            {(isPositive || isNegative) && (
                <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{change?.toLocaleString()} vs last refresh
                </p>
            )}
        </div>
    </div>
  );
};

export default StatCard;