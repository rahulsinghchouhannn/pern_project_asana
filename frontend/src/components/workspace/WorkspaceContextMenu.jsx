import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 210;

const PencilIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const GearIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const WorkspaceContextMenu = ({
  position,
  onClose,
  onRename,
  onSettings,
  onDelete,
  canRename,
  canDelete,
}) => {
  const menuRef = useRef(null);

  const x = Math.min(position.x, window.innerWidth - MENU_WIDTH - 8);
  const y = Math.min(position.y, window.innerHeight - 160);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const Item = ({ icon, label, onClick, danger = false }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left rounded-md transition-colors ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 overflow-hidden"
      style={{ left: x, top: y, width: MENU_WIDTH }}
    >
      <div className="px-1.5">
        {canRename && (
          <Item icon={<PencilIcon />} label="Rename workspace" onClick={onRename} />
        )}
        <Item icon={<GearIcon />} label="Settings" onClick={onSettings} />
      </div>

      {canDelete && (
        <>
          <div className="my-1.5 border-t border-gray-100" />
          <div className="px-1.5">
            <Item icon={<TrashIcon />} label="Delete workspace" onClick={onDelete} danger />
          </div>
        </>
      )}
    </div>,
    document.body
  );
};

export default WorkspaceContextMenu;
