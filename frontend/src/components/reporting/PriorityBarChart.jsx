import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PRIORITY_COLORS = {
  none: "#9CA3AF",
  low: "#3B82F6",
  medium: "#F59E0B",
  high: "#F97316",
  urgent: "#EF4444",
};

const PRIORITY_LABELS = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PriorityBarChart = ({ tasksByPriority = {} }) => {
  const data = ["none", "low", "medium", "high", "urgent"].map((key) => ({
    name: PRIORITY_LABELS[key],
    count: tasksByPriority[key] ?? 0,
    color: PRIORITY_COLORS[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#F9FAFB" }}
          contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
          formatter={(value) => [value, "Tasks"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PriorityBarChart;
