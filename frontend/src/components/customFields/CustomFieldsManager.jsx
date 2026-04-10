import React, { useEffect, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import customFieldService from "@/services/customFieldService";

const FIELD_TYPE_ICONS = {
  text:     "T",
  number:   "#",
  dropdown: "▾",
  date:     "📅",
  user:     "👤",
};

const CustomFieldsManager = ({ projectId, onClose, onFieldsChanged }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ── Inline rename state ──────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editingRef = useRef(null); // { id, original }
  const editValueRef = useRef("");
  const editTimerRef = useRef(null);

  useEffect(() => {
    customFieldService
      .getProjectFields(projectId)
      .then((res) => setFields(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (fieldId) => {
    try {
      await customFieldService.deleteField(projectId, fieldId);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
      onFieldsChanged?.();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // ── Rename ───────────────────────────────────────────────────────────────────

  const saveRename = async (fieldId, name) => {
    try {
      await customFieldService.updateField(projectId, fieldId, { name });
      setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, name } : f)));
      onFieldsChanged?.();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (field) => {
    // Close any open delete confirm
    setConfirmDeleteId(null);
    clearTimeout(editTimerRef.current);
    editingRef.current = { id: field.id, original: field.name };
    editValueRef.current = field.name;
    setEditingId(field.id);
    setEditValue(field.name);
  };

  const handleEditChange = (value) => {
    editValueRef.current = value;
    setEditValue(value);
    clearTimeout(editTimerRef.current);
    editTimerRef.current = setTimeout(() => {
      const r = editingRef.current;
      const trimmed = editValueRef.current.trim();
      if (r && trimmed) saveRename(r.id, trimmed);
    }, 600);
  };

  const commitEdit = () => {
    clearTimeout(editTimerRef.current);
    const r = editingRef.current;
    if (r) {
      const trimmed = editValueRef.current.trim();
      if (trimmed && trimmed !== r.original) saveRename(r.id, trimmed);
    }
    editingRef.current = null;
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    clearTimeout(editTimerRef.current);
    const r = editingRef.current;
    if (r) {
      // If debounce already saved a different name, restore original
      const currentName = fields.find((f) => f.id === r.id)?.name;
      if (currentName && currentName !== r.original) {
        saveRename(r.id, r.original);
      }
    }
    editingRef.current = null;
    setEditingId(null);
    setEditValue("");
  };

  // ── Drag reorder ─────────────────────────────────────────────────────────────

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = Array.from(fields);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setFields(reordered);

    try {
      await customFieldService.reorderFields(projectId, reordered.map((f) => f.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Custom fields</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : fields.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No custom fields yet. Add one from the + button in the table header.
            </p>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1"
                  >
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all
                              ${snapshot.isDragging
                                ? "shadow-md bg-indigo-50 border-indigo-200"
                                : "bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200"}`}
                          >
                            {/* Drag handle */}
                            <span
                              {...provided.dragHandleProps}
                              className="text-gray-300 cursor-grab active:cursor-grabbing shrink-0"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                              </svg>
                            </span>

                            {/* Type icon */}
                            <span className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-xs font-bold text-gray-600 shrink-0">
                              {FIELD_TYPE_ICONS[field.type] ?? "?"}
                            </span>

                            {/* Name + type — click name to rename inline */}
                            <div className="flex-1 min-w-0">
                              {editingId === field.id ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => handleEditChange(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                                    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full text-sm font-medium text-gray-800 bg-white border border-indigo-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                              ) : (
                                <button
                                  onClick={() => startEdit(field)}
                                  className="text-sm font-medium text-gray-800 truncate block w-full text-left hover:text-indigo-600 transition-colors"
                                  title="Click to rename"
                                >
                                  {field.name}
                                </button>
                              )}
                              <span className="text-xs text-gray-400 capitalize">{field.type.replace("_", " ")}</span>
                            </div>

                            {/* Required badge */}
                            {field.isRequired && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium shrink-0">
                                Required
                              </span>
                            )}

                            {/* Delete */}
                            {confirmDeleteId === field.id ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleDelete(field.id)}
                                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { commitEdit(); setConfirmDeleteId(field.id); }}
                                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                                title="Delete field"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomFieldsManager;
