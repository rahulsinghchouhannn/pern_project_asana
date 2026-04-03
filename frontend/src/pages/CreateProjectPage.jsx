import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createProject } from "@/store/slices/projectSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const STEP_DETAILS = 1;
const STEP_VIEWS = 2;

const ALL_VIEWS = [
  {
    key: "overview",
    label: "Overview",
    description: "Align on project info and resources",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: "list",
    label: "List",
    description: "Organize tasks in a powerful table",
    required: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: "board",
    label: "Board",
    description: "Track work in a Kanban view",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    key: "timeline",
    label: "Timeline",
    description: "Schedule work over time",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Monitor project metrics and insights",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.projects);

  const [step, setStep] = useState(STEP_DETAILS);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [nameError, setNameError] = useState("");
  const [selectedViews, setSelectedViews] = useState(["overview", "list", "board", "dashboard"]);

  const handleContinue = () => {
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setStep(STEP_VIEWS);
  };

  const toggleView = (key) => {
    if (key === "list") return;
    setSelectedViews((prev) =>
      prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
    );
  };

  const handleCreate = async () => {
    const result = await dispatch(
      createProject({
        name: name.trim(),
        isPrivate,
        views: selectedViews,
        defaultView: "list",
      })
    );
    if (createProject.fulfilled.match(result)) {
      navigate(`/projects/${result.payload.id}`);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">
            {step === STEP_DETAILS ? "New project" : "Choose views for your project"}
          </h1>
          <button
            onClick={() => navigate("/projects/new")}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === STEP_DETAILS && (
            <div className="flex flex-col gap-5">
              <Input
                id="project-name"
                label="Project name"
                placeholder="My awesome project"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                error={nameError}
              />

              {/* Project access */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Project access</label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      !isPrivate
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      !isPrivate ? "border-indigo-600" : "border-gray-300"
                    }`}>
                      {!isPrivate && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">My workspace</p>
                      <p className="text-xs text-gray-500">Everyone in your workspace can find and access this project.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      isPrivate
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isPrivate ? "border-indigo-600" : "border-gray-300"
                    }`}>
                      {isPrivate && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Private</p>
                      <p className="text-xs text-gray-500">Only invited members can find and access this project.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === STEP_VIEWS && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 mb-1">
                Select the views you want for <span className="font-medium text-gray-800">{name}</span>. List is always included.
              </p>
              {ALL_VIEWS.map((view) => {
                const isSelected = selectedViews.includes(view.key);
                return (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => toggleView(view.key)}
                    disabled={view.required}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors w-full ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${view.required ? "cursor-default" : ""}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Icon */}
                    <span className={`shrink-0 ${isSelected ? "text-indigo-600" : "text-gray-400"}`}>
                      {view.icon}
                    </span>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{view.label}</span>
                      {view.required && (
                        <span className="ml-1.5 text-xs text-gray-400">(required)</span>
                      )}
                      <p className="text-xs text-gray-500">{view.description}</p>
                    </div>
                  </button>
                );
              })}

              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
          {step === STEP_DETAILS ? (
            <>
              <Button variant="secondary" onClick={() => navigate("/projects/new")}>
                Back
              </Button>
              <Button variant="primary" onClick={handleContinue}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep(STEP_DETAILS)}>
                Back
              </Button>
              <Button variant="primary" loading={isLoading} onClick={handleCreate}>
                Create project
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default CreateProjectPage;
