
import React from 'react';
import { Stats } from '../types.ts';

interface AnalyticsChartProps {
  data: Stats[];
  metric: keyof Omit<Stats, 'name'>;
  title?: string;
  strokeColor: string;
  gradientFromColor: string;
  gradientToColor: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, metric, title, strokeColor, gradientFromColor, gradientToColor }) => {
  if (!data || data.length < 2) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {title && <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>}
            <p>Not enough data to display chart.</p>
        </div>
    );
  }

  const width = 800;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const maxValue = Math.max(...data.map(d => d[metric]), 0);
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  const yScale = (value: number) => height - padding.bottom - (value / (maxValue || 1)) * (height - padding.top - padding.bottom);

  const areaPath = `M${padding.left},${height - padding.bottom} ` +
    data.map((d, i) => `L${xScale(i)},${yScale(d[metric])}`).join(' ') +
    ` L${width - padding.right},${height - padding.bottom} Z`;
    
  const linePath = `M` + data.map((d, i) => `${xScale(i)},${yScale(d[metric])}`).join(' L');
  
  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = Math.ceil((maxValue / 4) * i);
    return {
      value: value,
      y: yScale(value)
    };
  });
  
  const gradientId = `gradient-${metric}`;

  return (
    <div className="w-full h-full flex flex-col">
        {title && <h3 className="text-lg font-semibold text-white px-2">{title}</h3>}
        <div className="flex-grow">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientFromColor} />
                    <stop offset="100%" stopColor={gradientToColor} />
                </linearGradient>
                </defs>

                {/* Y-axis grid lines and labels */}
                {yAxisLabels.map(({ value, y }) => (
                <g key={value}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#374151" strokeDasharray="3,3" />
                    <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="12">
                    {value.toLocaleString()}
                    </text>
                </g>
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => (
                <text key={d.name} x={xScale(i)} y={height - padding.bottom + 20} textAnchor="middle" fill="#9ca3af" fontSize="12">
                    {d.name}
                </text>
                ))}
                
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" />

                {data.map((d, i) => (
                    <circle key={`dot-${i}`} cx={xScale(i)} cy={yScale(d[metric])} r="4" fill={strokeColor} stroke="#1f2937" strokeWidth="2" />
                ))}
            </svg>
        </div>
    </div>
  );
};

export default AnalyticsChart;