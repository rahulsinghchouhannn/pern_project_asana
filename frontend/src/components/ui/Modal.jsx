import React from "react";

// Placeholder — implement full modal in Phase 2
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
