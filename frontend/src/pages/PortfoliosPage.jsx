import React, { useState } from "react";
import Button from "@/components/ui/Button";

const TABS = ["Recent and starred", "Browse all"];

const PortfoliosPage = () => {
  const [activeTab, setActiveTab] = useState("Recent and starred");

  return (
    <div
      className="flex flex-col h-full bg-white"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* Header */}
      <div className="px-8 pt-6 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Portfolios</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Blurred table preview in background */}
        <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none select-none px-8 pt-6">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              <div className="w-64 px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Portfolio</div>
              <div className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progress</div>
              <div className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</div>
              <div className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Owner</div>
              <div className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due date</div>
            </div>
            {/* Table rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex border-b border-gray-100">
                <div className="w-64 px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                <div className="w-32 px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
                <div className="w-32 px-4 py-3">
                  <div className="h-3 bg-green-200 rounded w-16" />
                </div>
                <div className="w-32 px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
                <div className="w-32 px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty state — centered on top */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Get the big picture with portfolios
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Monitor the status, progress, and priorities of all your projects in one place.
            </p>
          </div>

          <Button variant="primary" size="md">
            Explore portfolios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PortfoliosPage;
