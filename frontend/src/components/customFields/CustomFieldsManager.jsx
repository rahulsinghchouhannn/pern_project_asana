import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import customFieldService from "@/services/customFieldService";
import AddCustomFieldModal from "./AddCustomFieldModal";

const FIELD_TYPE_ICONS = {
  text:     "T",
  number:   "#",
  dropdown: "▾",
  date:     "📅",
  user:     "👤",
};

const CustomFieldsManager = ({ projectId, onClose }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    customFieldService
      .getProjectFields(projectId)
      .then((res) => setFields(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleFieldCreated = (field) => {
    setFields((prev) => [...prev, field]);
  };

  const handleDelete = async (fieldId) => {
    try {
      await customFieldService.deleteField(projectId, fieldId);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

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
    <>
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
            ) : (
              <>
                {fields.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No custom fields yet. Add one below.
                  </p>
                )}

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-1 mb-4"
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
                                  className="text-gray-300 cursor-grab active:cursor-grabbing"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                  </svg>
                                </span>

                                {/* Type icon */}
                                <span className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-xs font-bold text-gray-600 flex-shrink-0">
                                  {FIELD_TYPE_ICONS[field.type] ?? "?"}
                                </span>

                                {/* Name + type */}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-800 truncate block">
                                    {field.name}
                                  </span>
                                  <span className="text-xs text-gray-400 capitalize">{field.type}</span>
                                </div>

                                {/* Required badge */}
                                {field.isRequired && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium flex-shrink-0">
                                    Required
                                  </span>
                                )}

                                {/* Delete */}
                                {confirmDeleteId === field.id ? (
                                  <div className="flex items-center gap-1 flex-shrink-0">
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
                                    onClick={() => setConfirmDeleteId(field.id)}
                                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
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

                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add field
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddCustomFieldModal
          projectId={projectId}
          onCreated={handleFieldCreated}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
};

export default CustomFieldsManager;
