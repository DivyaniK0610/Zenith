import React, { useState, useEffect } from 'react';
import { fetchHeatmapData } from '../api/habits';
// Assuming you have a way to get the current user's ID. 
// Replace 'hardcoded-uuid' with your actual user ID state/context.
const USER_ID = "YOUR_USER_ID_HERE"; 

export default function Analytics() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch the last 12 weeks of data
        const data = await fetchHeatmapData(USER_ID, 12);
        // Assuming the backend returns an array of daily objects: 
        // [{ date: '2023-10-01', count: 2 }, ...]
        setHeatmapData(data);
      } catch (error) {
        console.error("Failed to fetch heatmap data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper to determine the color intensity of a square
  const getColorClass = (count) => {
    if (!count || count === 0) return 'bg-gray-100 border-gray-200';
    if (count === 1) return 'bg-green-200 border-green-300';
    if (count === 2) return 'bg-green-400 border-green-500';
    if (count >= 3) return 'bg-green-600 border-green-700';
    return 'bg-gray-100 border-gray-200';
  };

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Track your consistency over time.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">12-Week Contribution Activity</h2>
        
        {isLoading ? (
          <div className="animate-pulse flex space-x-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {heatmapData.map((day, index) => (
              <div 
                key={index}
                title={`${day.date}: ${day.count || 0} habits completed`}
                className={`w-4 h-4 rounded-sm border ${getColorClass(day.count)} transition-colors duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-green-400`}
              ></div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center text-xs text-gray-500 gap-2">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
          <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-300"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400 border border-green-500"></div>
          <div className="w-3 h-3 rounded-sm bg-green-600 border border-green-700"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}