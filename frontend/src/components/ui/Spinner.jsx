import React from "react";

// Placeholder — implement full spinner in Phase 2
const sizeStyles = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const Spinner = ({ size = "md", className = "" }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 ${sizeStyles[size] || sizeStyles.md} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
