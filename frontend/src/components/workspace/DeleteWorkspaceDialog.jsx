import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const DeleteWorkspaceDialog = ({ org, onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const isMatch = inputValue === org.name;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Delete workspace</h2>
            <p className="text-xs text-gray-400 mt-0.5">This action is permanent and cannot be undone</p>
          </div>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-500 mb-4">
          Deleting <strong className="text-gray-800">{org.name}</strong> will permanently remove all projects, tasks, members, and data associated with this workspace.
        </p>

        <p className="text-sm text-gray-600 mb-2">
          Type <strong className="text-gray-800 select-none">{org.name}</strong> to confirm:
        </p>
        <input
          autoFocus
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          placeholder={org.name}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Delete workspace
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteWorkspaceDialog;
