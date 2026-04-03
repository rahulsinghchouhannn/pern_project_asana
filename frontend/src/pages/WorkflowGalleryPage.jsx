import React from "react";
import { useNavigate } from "react-router-dom";

const WorkflowGalleryPage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Workflow gallery</h1>
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Tab row */}
        <div className="flex gap-2 mb-8">
          <button className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium">
            For you
          </button>
          <button className="px-4 py-1.5 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
            My organization
          </button>
        </div>

        {/* Your workflows */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your workflows</h2>
          <p className="text-sm text-gray-500 mb-6">
            Quick access to workflows you've built or previously used to kick off work
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start something new */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Start something new</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create a new project or template to get work moving
                </p>
              </div>
              <button
                onClick={() => navigate("/projects/new/blank")}
                className="mt-1 px-4 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                + Create blank project
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default WorkflowGalleryPage;
