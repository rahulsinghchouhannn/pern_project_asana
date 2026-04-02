import React, { useState } from "react";
import customFieldService from "@/services/customFieldService";

const FIELD_TYPES = [
  { value: "text",     label: "Text",     icon: "T" },
  { value: "number",   label: "Number",   icon: "#" },
  { value: "dropdown", label: "Dropdown", icon: "▾" },
  { value: "date",     label: "Date",     icon: "📅" },
  { value: "user",     label: "User",     icon: "👤" },
];

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

const AddCustomFieldModal = ({ projectId, onCreated, onClose }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState([{ value: "", color: "#6366f1" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [key]: val } : opt))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }

    const data = { name: name.trim(), type, isRequired };
    if (type === "dropdown") {
      const validOptions = options.filter((o) => o.value.trim());
      if (validOptions.length === 0) { setError("Add at least one option"); return; }
      data.options = validOptions.map((o) => ({ value: o.value.trim(), color: o.color }));
    }

    setSaving(true);
    setError("");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add custom field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Field name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Story Points"
              maxLength={100}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Field type</label>
            <div className="grid grid-cols-5 gap-1.5">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => setType(ft.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors
                    ${type === ft.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <span className="text-base leading-none">{ft.icon}</span>
                  <span>{ft.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown options editor */}
          {type === "dropdown" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={opt.color}
                      onChange={(e) => handleOptionChange(i, "color", e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                      title="Option color"
                    />
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => handleOptionChange(i, "value", e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add option
                </button>
              </div>
            </div>
          )}

          {/* Required toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-8 h-4 rounded-full transition-colors ${isRequired ? "bg-indigo-600" : "bg-gray-200"}`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isRequired ? "translate-x-4" : ""}`}
              />
            </div>
            <span className="text-xs text-gray-600">Required field</span>
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating…" : "Create field"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomFieldModal;
