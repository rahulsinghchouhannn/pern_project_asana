import React, { useState } from "react";
import Button from "@/components/ui/Button";

const TABS = ["Strategy map", "Team goals", "My goals", "+"];

// ─── Strategy map visualization ───────────────────────────────────────────────

const MapNode = ({ label, sub, isRoot }) => (
  <div
    className={`rounded-xl border px-4 py-3 shadow-sm min-w-[160px] max-w-[200px] ${
      isRoot ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"
    }`}
  >
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-2 h-2 rounded-full shrink-0 ${isRoot ? "bg-indigo-500" : "bg-gray-300"}`} />
      <span className={`text-xs font-semibold truncate ${isRoot ? "text-indigo-700" : "text-gray-700"}`}>
        {label}
      </span>
    </div>
    {sub && <p className="text-[11px] text-gray-400 pl-4 truncate">{sub}</p>}
  </div>
);

const ConnectorH = () => (
  <div className="flex items-center">
    <div className="w-6 h-px bg-gray-300" />
  </div>
);

const ConnectorV = () => <div className="w-px h-6 bg-gray-300 mx-auto" />;

const StrategyMap = () => (
  <div className="flex flex-col items-center gap-2 pt-6 select-none">
    {/* Root */}
    <MapNode label="Org goals" sub="Q2 FY26" isRoot />
    <ConnectorV />

    {/* Level 2 — 3 nodes */}
    <div className="flex items-center gap-4">
      <MapNode label="Revenue growth" sub="0 sub-goals" />
      <ConnectorH />
      <MapNode label="Product quality" sub="0 sub-goals" />
      <ConnectorH />
      <MapNode label="Team health" sub="0 sub-goals" />
    </div>
    <div className="flex items-center gap-4 pl-4">
      <ConnectorV />
      <div className="w-px h-6 bg-transparent" />
      <ConnectorV />
      <div className="w-px h-6 bg-transparent" />
      <ConnectorV />
    </div>

    {/* Level 3 — 2 leaf nodes */}
    <div className="flex items-center gap-16">
      <MapNode label="Q2 milestone" sub="No description" />
      <MapNode label="Launch feature" sub="No description" />
    </div>
  </div>
);

// ─── Step 1 panel ─────────────────────────────────────────────────────────────

const SetupPanel = ({ onSkip, onContinue }) => (
  <div className="flex flex-col justify-center h-full px-10 py-8 max-w-sm">
    <div className="flex items-center gap-2 mb-6">
      <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
        Step 1 of 2
      </span>
    </div>

    <h2 className="text-lg font-bold text-gray-900 mb-2">
      Welcome to goals strategy map
    </h2>
    <p className="text-sm text-gray-500 mb-6">
      Connect your team's work to company objectives. Create a goal to get started.
    </p>

    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-600 mb-1">Goal title</label>
      <input
        type="text"
        placeholder="Enter a goal title..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>

    <div className="flex items-center gap-2 mb-2 px-1">
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-sm text-gray-600">Time period: Q2 FY26</span>
    </div>

    <div className="flex items-center gap-2 mb-8 px-1">
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
      </svg>
      <span className="text-sm text-gray-500">0 people will be notified</span>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={onSkip}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Skip to map
      </button>
      <Button variant="primary" size="sm" onClick={onContinue}>
        Continue
      </Button>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const GoalsPage = () => {
  const [activeTab, setActiveTab] = useState("Strategy map");

  return (
    <div
      className="flex flex-col h-full bg-white"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* Header */}
      <div className="px-8 pt-6 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Goals</h1>
          <button className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
            Send feedback
          </button>
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

      {activeTab === "Strategy map" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left setup panel */}
          <div className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto">
            <SetupPanel onSkip={() => {}} onContinue={() => {}} />
          </div>

          {/* Right: map area */}
          <div className="flex-1 bg-[#F0F4FF] overflow-auto p-6">
            <StrategyMap />
          </div>
        </div>
      )}

      {(activeTab === "Team goals" || activeTab === "My goals") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800">
            {activeTab === "Team goals"
              ? "You haven't added team goals yet."
              : "You haven't added any personal goals."}
          </h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Goals help you track what matters most. Create a goal to get started.
          </p>
          <Button variant="primary" size="sm">Create goal</Button>
        </div>
      )}

      {activeTab === "+" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Configure goal views here
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
