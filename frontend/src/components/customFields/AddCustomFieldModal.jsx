import { useState, useEffect, useRef } from "react";
import customFieldService from "@/services/customFieldService";

const FIELD_TYPES = [
  {
    value: "text",
    label: "Text",
    icon: <span className="font-bold text-xs leading-none">T</span>,
  },
  {
    value: "number",
    label: "Number",
    icon: <span className="font-bold text-xs leading-none">#</span>,
  },
  {
    value: "dropdown",
    label: "Dropdown",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ),
  },
  {
    value: "date",
    label: "Date",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: "user",
    label: "User",
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
  {
    value: "timer",
    label: "Timer",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

const AddCustomFieldModal = ({ projectId, onCreated, onClose, anchorRef }) => {
  const panelRef = useRef(null);
  const nameInputRef = useRef(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState([{ value: "", color: "#6366f1" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const isTimer = type === "timer";

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }, [anchorRef]);

  useEffect(() => {
    if (!isTimer) nameInputRef.current?.focus();
  }, [isTimer]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose, anchorRef]);

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { value: "", color: DEFAULT_COLORS[prev.length % DEFAULT_COLORS.length] },
    ]);
  };

  const handleRemoveOption = (index) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, key, val) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, [key]: val } : opt)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isTimer) {
      // Create both Estimated Time and Actual Time fields
      setSaving(true);
      try {
        const [estRes, actRes] = await Promise.all([
          customFieldService.createField(projectId, {
            name: "Estimated Time",
            type: "estimated_time",
            isRequired: false,
          }),
          customFieldService.createField(projectId, {
            name: "Actual Time",
            type: "actual_time",
            isRequired: false,
          }),
        ]);
        onCreated(estRes.data.data);
        onCreated(actRes.data.data);
        onClose();
      } catch (err) {
        setError(err.response?.data?.message ?? "Failed to create timer fields");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!name.trim()) { setError("Name is required"); return; }

    const data = { name: name.trim(), type, isRequired: false };
    if (type === "dropdown") {
      const validOptions = options.filter((o) => o.value.trim());
      if (validOptions.length === 0) { setError("Add at least one option"); return; }
      data.options = validOptions.map((o) => ({ value: o.value.trim(), color: o.color }));
    }

    setSaving(true);
    try {
      const res = await customFieldService.createField(projectId, data);
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to create field");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-60 bg-white rounded-xl shadow-xl border border-gray-200 w-64"
      style={{ top: position.top, right: position.right }}
    >
      <form onSubmit={handleSubmit}>
        {/* Field name input — hidden for timer type */}
        {!isTimer && (
          <div className="p-3 border-b border-gray-100">
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Story Points"
              maxLength={100}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
            />
          </div>
        )}

        {/* Timer description banner */}
        {isTimer && (
          <div className="px-3 py-2.5 border-b border-gray-100 bg-indigo-50/60">
            <p className="text-xs text-indigo-700 font-medium">Creates two columns:</p>
            <p className="text-xs text-indigo-600 mt-0.5">Estimated Time · Actual Time</p>
          </div>
        )}

        {/* Field type list */}
        <div className="py-1">
          {FIELD_TYPES.map((ft) => {
            const selected = type === ft.value;
            return (
              <button
                key={ft.value}
                type="button"
                onClick={() => setType(ft.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left
                  ${selected ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded shrink-0 ${selected ? "text-indigo-600" : "text-gray-500"}`}>
                  {ft.icon}
                </span>
                <span className={`font-medium ${selected ? "text-indigo-700" : "text-gray-700"}`}>
                  {ft.label}
                </span>
                {selected && (
                  <svg className="w-3.5 h-3.5 ml-auto text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Dropdown options editor */}
        {type === "dropdown" && (
          <div className="px-3 pb-2 border-t border-gray-100 pt-2">
            <p className="text-xs font-medium text-gray-500 mb-2">Options</p>
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={opt.color}
                    onChange={(e) => handleOptionChange(i, "color", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                    title="Option color"
                  />
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) => handleOptionChange(i, "value", e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors mt-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add option
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 px-3 pb-1">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (!isTimer && !name.trim())}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Creating…" : isTimer ? "Create fields" : "Create field"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomFieldModal;
