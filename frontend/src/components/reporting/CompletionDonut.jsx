import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const CompletionDonut = ({ completionRate = 0, completedTasks = 0, totalTasks = 0 }) => {
  const remaining = 100 - completionRate;
  const data = [
    { name: "Completed", value: completionRate },
    { name: "Remaining", value: remaining > 0 ? remaining : 0 },
  ];

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <p className="text-sm">No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={76}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#6366F1" />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-800">{completionRate}%</span>
          <span className="text-xs text-gray-500">complete</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          {completedTasks} done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          {totalTasks - completedTasks} left
        </span>
      </div>
    </div>
  );
};

export default CompletionDonut;
