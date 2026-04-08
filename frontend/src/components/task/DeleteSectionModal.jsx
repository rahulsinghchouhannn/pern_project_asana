import { useEffect, useRef } from "react";

/**
 * DeleteSectionModal — confirmation dialog before deleting a section and all its tasks.
 *
 * Props:
 *  sectionName  – name of the section being deleted
 *  taskCount    – number of tasks that will be permanently deleted
 *  onConfirm()  – called when user confirms
 *  onCancel()   – called when user cancels or clicks backdrop
 */
const DeleteSectionModal = ({ sectionName, taskCount, onConfirm, onCancel }) => {
  const confirmBtnRef = useRef(null);

  // Focus the confirm button so user can press Enter to confirm
  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Warning icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-base font-semibold text-gray-900 text-center mb-2">
          Delete section and all tasks?
        </h2>

        <p className="text-sm text-gray-500 text-center mb-1">
          You are about to permanently delete{" "}
          <span className="font-medium text-gray-800">"{sectionName}"</span>.
        </p>

        {taskCount > 0 && (
          <p className="text-sm text-red-600 text-center font-medium mb-4">
            This will also delete {taskCount} {taskCount === 1 ? "task" : "tasks"} inside it.
            This action cannot be undone.
          </p>
        )}

        {taskCount === 0 && (
          <p className="text-sm text-gray-500 text-center mb-4">
            This action cannot be undone.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Delete {taskCount > 0 ? `${taskCount} tasks` : "section"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSectionModal;
