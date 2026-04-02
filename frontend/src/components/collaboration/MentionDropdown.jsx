import React, { useEffect, useRef } from "react";

const MentionDropdown = ({ suggestions, selectedIndex, onSelect, style }) => {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!suggestions.length) return null;

  return (
    <ul
      ref={listRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-h-48 overflow-y-auto"
      style={style}
    >
      {suggestions.map((user, i) => (
        <li
          key={user.userId}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
            i === selectedIndex ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-indigo-700">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <span className="truncate">{user.name}</span>
        </li>
      ))}
    </ul>
  );
};

export default MentionDropdown;
