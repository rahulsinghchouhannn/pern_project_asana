import React, { useRef, useState } from "react";
import MentionDropdown from "./MentionDropdown";

// Parse the @[Name](userId) syntax from text for display; here we just submit raw content
const CommentBox = ({ projectMembers = [], onSubmit, disabled = false }) => {
  const textareaRef = useRef(null);
  const [content, setContent] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null); // { query, startIndex }
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart;
    // Find the @ before cursor on the same line
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      const filtered = projectMembers.filter((m) =>
        m.name?.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setSelectedIndex(0);
      setMentionQuery({ query, startIndex: cursor - atMatch[0].length });

      // Position dropdown below textarea (simplified: just below the textarea)
      const ta = textareaRef.current;
      if (ta) {
        setDropdownPos({ bottom: "100%", left: 0 });
      }
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  const insertMention = (user) => {
    if (!mentionQuery) return;
    const ta = textareaRef.current;
    const before = content.slice(0, mentionQuery.startIndex);
    const after = content.slice(ta.selectionStart);
    const markup = `@[${user.name}](${user.userId})`;
    const newContent = before + markup + " " + after;
    setContent(newContent);
    setMentionQuery(null);
    setSuggestions([]);

    // Restore focus and move cursor after inserted markup
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + markup.length + 1;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (suggestions[selectedIndex]) insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        setSuggestions([]);
        return;
      }
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setContent("");
    setMentionQuery(null);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Write a comment… Type @ to mention someone"
          disabled={disabled}
          className="w-full text-sm text-gray-700 px-3 py-2 resize-none border-0 focus:outline-none focus:ring-0 rounded-lg"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
          <button
            onClick={handleSubmit}
            disabled={disabled || !content.trim()}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Comment
          </button>
        </div>
      </div>

      {suggestions.length > 0 && mentionQuery !== null && (
        <MentionDropdown
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={insertMention}
          style={{ bottom: "100%", left: 0, marginBottom: 4 }}
        />
      )}
    </div>
  );
};

export default CommentBox;
