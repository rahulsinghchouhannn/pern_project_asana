import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "../TaskCard";
import TaskDetailModal from "../TaskDetailModal";
import CreateTaskModal from "../CreateTaskModal";
import taskService from "@/services/taskService";

// Build column state from statuses + tasks
const buildColumns = (statuses, tasks) =>
  statuses
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      statusId: s.id,
      statusName: s.name,
      statusColor: s.color,
      tasks: tasks
        .filter((t) => t.statusId === s.id)
        .slice()
        .sort((a, b) => a.position - b.position),
    }));

const BoardView = ({
  projectId,
  tasks: propTasks = [],
  statuses = [],
  projectMembers = [],
  onTaskCreated,
  onTaskUpdated,
}) => {
  const [columns, setColumns] = useState(() => buildColumns(statuses, propTasks));
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createForStatus, setCreateForStatus] = useState(null);

  // Sync columns when upstream tasks change (e.g. after create/update)
  useEffect(() => {
    setColumns(buildColumns(statuses, propTasks));
  }, [propTasks, statuses]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const prevColumns = columns;

    // Build new column state optimistically
    const next = columns.map((col) => ({ ...col, tasks: [...col.tasks] }));
    const srcCol = next.find((c) => c.statusId === source.droppableId);
    const dstCol = next.find((c) => c.statusId === destination.droppableId);

    const [movedTask] = srcCol.tasks.splice(source.index, 1);
    const updatedTask = { ...movedTask, statusId: dstCol.statusId };
    dstCol.tasks.splice(destination.index, 0, updatedTask);

    setColumns(next);

    // Build bulk position updates for the affected columns
    const updates = [];
    dstCol.tasks.forEach((t, idx) => {
      updates.push({ taskId: t.id, statusId: dstCol.statusId, position: idx });
    });
    // If source and dest differ, also re-index the source column
    if (srcCol.statusId !== dstCol.statusId) {
      srcCol.tasks.forEach((t, idx) => {
        updates.push({ taskId: t.id, statusId: srcCol.statusId, position: idx });
      });
    }

    taskService.bulkUpdatePositions(updates).catch(() => {
      // Rollback on error
      setColumns(prevColumns);
    });

    // Notify parent so shared task state stays in sync
    onTaskUpdated?.({ ...updatedTask });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setCreateForStatus(statuses[0]?.id ?? null)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
        <span className="text-xs text-gray-400">{propTasks.length} tasks</span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 h-full p-4 min-w-max">
            {columns.map((col) => (
              <div key={col.statusId} className="flex flex-col w-70 flex-shrink-0" style={{ width: 280 }}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: col.statusColor ?? "#9CA3AF" }}
                  />
                  <span className="text-sm font-semibold text-gray-700 truncate">{col.statusName}</span>
                  <span
                    className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: (col.statusColor ?? "#9CA3AF") + "22",
                      color: col.statusColor ?? "#6B7280",
                    }}
                  >
                    {col.tasks.length}
                  </span>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.statusId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto rounded-xl p-2 transition-colors min-h-16
                        ${snapshot.isDraggingOver ? "bg-indigo-50 ring-2 ring-indigo-200" : "bg-gray-50"}`}
                    >
                      {col.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <TaskCard
                              ref={provided.innerRef}
                              task={task}
                              onClick={setSelectedTaskId}
                              draggableProps={provided.draggableProps}
                              dragHandleProps={provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              isDragging={snapshot.isDragging}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add task */}
                <button
                  onClick={() => setCreateForStatus(col.statusId)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors w-full"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add task
                </button>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {createForStatus && (
        <CreateTaskModal
          projectId={projectId}
          statuses={statuses}
          defaultStatusId={createForStatus}
          onCreated={(task) => { onTaskCreated?.(task); setCreateForStatus(null); }}
          onClose={() => setCreateForStatus(null)}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={projectId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(task) => { onTaskUpdated?.(task); }}
        />
      )}
    </div>
  );
};

export default BoardView;
