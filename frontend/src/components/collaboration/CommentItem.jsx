import React, { useState } from "react";

// Format @[Name](userId) into highlighted spans
const renderContent = (content) => {
  const parts = [];
  const regex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <span
        key={match.index}
        className="bg-indigo-50 text-indigo-700 rounded px-0.5 font-medium"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>);
  }

  return parts;
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const CommentItem = ({ comment, currentUserId, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isAuthor = comment.authorId === currentUserId;

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onEdit(comment.id, editContent.trim());
    setEditing(false);
  };

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-indigo-700">
            {comment.authorName?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-800">{comment.authorName}</span>
          <span className="text-xs text-gray-400">{relativeTime(comment.createdAt)}</span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
          {isAuthor && !editing && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => { setEditing(true); setEditContent(comment.content); }}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors px-1"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              autoFocus
              className="w-full text-sm text-gray-700 border border-indigo-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {renderContent(comment.content)}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
