import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskRow from "../TaskRow";
import TaskDetailModal from "../TaskDetailModal";
import InlineTaskRow from "../InlineTaskRow";
import SectionRow from "../SectionRow";
import DeleteSectionModal from "../DeleteSectionModal";
import customFieldService from "@/services/customFieldService";
import sectionService from "@/services/sectionService";
import taskService from "@/services/taskService";
import socketService from "@/services/socketService";
import AddCustomFieldModal from "@/components/customFields/AddCustomFieldModal";
import { formatMinutes } from "@/utils/timeFormat";
import { getRunningTimer, subscribeTimer, getElapsedMinutes } from "@/utils/timerStore";
import usePermissions from "@/hooks/usePermissions";

// ─── Field type icons ─────────────────────────────────────────────────────────

const FIELD_TYPE_ICONS = {
  text:           <span className="font-bold text-[10px]">T</span>,
  number:         <span className="font-bold text-[10px]">#</span>,
  dropdown:       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  date:           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  user:           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>,
  estimated_time: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  actual_time:    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// The "unsectioned" droppable id — reserved, never matches a real section id
const UNSECTIONED_DROP_ID = "unsectioned";

// ─── AddSectionInlineRow ──────────────────────────────────────────────────────

const AddSectionInlineRow = ({ projectId, onCreated, onCancel, colCount }) => {
  const [name, setName] = useState("");
  const inputRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const res = await sectionService.createSection(projectId, {
        name: name.trim() || "Untitled section",
      });
      onCreated?.(res.data.data);
    } catch {
      onCancel?.();
    } finally {
      savingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") { onCancel?.(); }
  };

  return (
    <tr className="border-t-2 border-b border-gray-200 bg-gray-50/60">
      <td colSpan={colCount + 1} className="py-1 px-2">
        <div className="flex items-center gap-2 h-8">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            placeholder="Section name…"
            className="flex-1 text-sm font-semibold text-gray-700 bg-transparent outline-none placeholder-gray-400"
          />
        </div>
      </td>
    </tr>
  );
};

// ─── Main ListView ─────────────────────────────────────────────────────────────

const ListView = ({
  projectId,
  tasks = [],
  statuses = [],
  sections: sectionsProp = [],
  projectMembers = [],
  customFieldsVersion = 0,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskBeforeCreate,
  onTaskSilentSave,
  onSectionCreated,
  onSectionUpdated,
  onSectionDeleted,
}) => {
  const currentUser = useSelector((state) => state.auth.user);
  const { can, guard, denyToast } = usePermissions(projectId);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);
  const [fieldValuesMap, setFieldValuesMap] = useState({});
  const [showAddField, setShowAddField] = useState(false);
  const addFieldBtnRef = useRef(null);

  // Running timer state — re-read from localStorage whenever timerStore notifies
  const [runningTimer, setRunningTimerState] = useState(
    () => currentUser?.id ? getRunningTimer(currentUser.id) : null
  );
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeTimer(() => setRunningTimerState(getRunningTimer(currentUser.id)));
    return unsub;
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local sections state
  const [sections, setSections] = useState(sectionsProp);
  const [collapsedMap, setCollapsedMap] = useState({});

  // Section drag-and-drop state (native HTML5 DnD)
  const [draggingSectionId, setDraggingSectionId] = useState(null);
  // sectionDropIndex: insertion point in the sections array (0 = before first, N = after Nth)
  const [sectionDropIndex, setSectionDropIndex] = useState(null);
  // Refs give synchronous access in drag event handlers without stale closures.
  // The first dragover fires before React can re-render with new state, so
  // reading state there always returns the pre-drag value (null) — the refs
  // are updated synchronously in the same call stack as the native event.
  const draggingSectionIdRef = useRef(null);
  const sectionDropIndexRef = useRef(null);
  // Always holds the latest sections array so the drop handler never reads stale state.
  const sectionsRef = useRef(sectionsProp);

  // Inline task creation
  const [activeInlineArea, setActiveInlineArea] = useState(null);

  // Add section inline input
  const [showAddSection, setShowAddSection] = useState(false);
  const [sectionInputKey, setSectionInputKey] = useState(0);

  // Delete section confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Subtask state ──────────────────────────────────────────────────────────
  // expandedTaskIds: Set of task IDs whose subtasks are currently shown
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
  // subtasksMap: { [parentTaskId]: subtask[] }
  const [subtasksMap, setSubtasksMap] = useState({});
  // addingSubtaskFor: parentTaskId | null — shows inline input below that task
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);
  const [subtaskInputKey, setSubtaskInputKey] = useState(0);
  // Ref so socket handlers can read current expanded state without stale closure
  const expandedTaskIdsRef = useRef(new Set());
  // Track locally created subtask IDs to suppress the socket echo after creation.
  const locallyCreatedSubtaskIds = useRef(new Set());
  // Counter incremented synchronously BEFORE each subtask createTask call.
  // While > 0 the socket handler buffers task:created events so the server-side
  // emit (which fires before the HTTP response) doesn't add a duplicate row.
  const pendingSubtaskCreateCount = useRef(0);
  const subtaskSocketBuffer = useRef([]);
  const [subtaskDragState, setSubtaskDragState] = useState({
    draggingSubtaskId: null,
    parentTaskId: null,
    dropIndex: null,
  });
  const subtaskDragStateRef = useRef({
    draggingSubtaskId: null,
    parentTaskId: null,
    dropIndex: null,
  });

  useEffect(() => {
    expandedTaskIdsRef.current = expandedTaskIds;
  }, [expandedTaskIds]);

  const setSubtaskDrag = useCallback((next) => {
    subtaskDragStateRef.current = next;
    setSubtaskDragState(next);
  }, []);

  // Sync sections whenever the prop changes
  useEffect(() => { setSections(sectionsProp); }, [sectionsProp]);

  // Keep sectionsRef in sync so drag handlers never read stale sections
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  // Real-time section reorder from other members
  useEffect(() => {
    if (!projectId) return;
    const handleSectionReordered = ({ sections: newSections }) => {
      setSections(newSections);
    };
    socketService.on("section:reordered", handleSectionReordered);
    return () => socketService.off("section:reordered", handleSectionReordered);
  }, [projectId]);

  // ── Custom fields ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId) return;
    customFieldService.getProjectFields(projectId)
      .then((res) => {
        const fields = res.data.data ?? [];
        setCustomFields(fields);
        setVisibleFieldIds((prev) => {
          const currentIds = new Set(fields.map((f) => f.id));
          const kept = prev.filter((id) => currentIds.has(id));
          const added = fields.filter((f) => !prev.includes(f.id)).map((f) => f.id);
          return added.length > 0 ? [...kept, ...added] : kept;
        });
      })
      .catch(() => {});
  }, [projectId, customFieldsVersion]);

  useEffect(() => {
    if (!projectId) return;
    customFieldService.getProjectFieldValues(projectId)
      .then((res) => { setFieldValuesMap(res.data.data ?? {}); })
      .catch(() => {});
  }, [projectId, customFieldsVersion]);

  useEffect(() => {
    if (tasks.length === 0) return;
    setFieldValuesMap((prev) => {
      const next = { ...prev };
      let changed = false;
      tasks.forEach((t) => {
        if (t.customFieldValues?.length > 0) { next[t.id] = t.customFieldValues; changed = true; }
      });
      return changed ? next : prev;
    });
  }, [tasks]);

  const handleFieldCreated = (field) => {
    setCustomFields((prev) => [...prev, field]);
    setVisibleFieldIds((prev) => [...prev, field.id]);
  };

  const visibleFields = customFields.filter((f) => visibleFieldIds.includes(f.id));
  const colCount = 3 + visibleFields.length;
  const defaultStatusId = statuses[0]?.id ?? null;

  // ── Task grouping ──────────────────────────────────────────────────────────

  const unsectionedTasks = tasks.filter((t) => !t.sectionId);
  const tasksBySection = sections.reduce((acc, s) => {
    acc[s.id] = tasks.filter((t) => t.sectionId === s.id);
    return acc;
  }, {});

  // ── Subtask socket subscription ────────────────────────────────────────────
  // ListView subscribes to subtask-specific socket events independently.
  // ProjectPage filters these out of its root tasks state.

  useEffect(() => {
    if (!projectId) return;

    const handleSocketTaskCreated = (task) => {
      if (!task.parentTaskId) return; // root tasks handled by ProjectPage
      // While a local subtask create is in-flight, buffer the event.
      // The server emits task:created before it sends the HTTP response, so
      // this event would arrive before onSilentSave registers the ID — buffering
      // lets us suppress our own echo once the HTTP response resolves.
      if (pendingSubtaskCreateCount.current > 0) {
        subtaskSocketBuffer.current.push(task);
        return;
      }
      // Suppress echo for locally created subtasks (remote-user path: count is 0)
      if (locallyCreatedSubtaskIds.current.has(task.id)) {
        locallyCreatedSubtaskIds.current.delete(task.id);
        return;
      }
      // Increment parent's subtaskCount regardless of expanded state so the badge
      // stays accurate even when the subtask list is collapsed.
      const parentTask = tasks.find((t) => t.id === task.parentTaskId);
      if (parentTask) {
        onTaskUpdated?.({ ...parentTask, subtaskCount: (parentTask.subtaskCount ?? 0) + 1 });
      }
      // Add to subtasksMap only if the parent is currently expanded
      if (!expandedTaskIdsRef.current.has(task.parentTaskId)) return;
      setSubtasksMap((prev) => {
        const existing = prev[task.parentTaskId] ?? [];
        if (existing.find((t) => t.id === task.id)) return prev;
        return { ...prev, [task.parentTaskId]: [...existing, task] };
      });
    };

    const handleSocketTaskUpdated = (task) => {
      if (!task.parentTaskId) return; // root task updates handled by ProjectPage
      setSubtasksMap((prev) => {
        const existing = prev[task.parentTaskId];
        if (!existing) return prev;
        return {
          ...prev,
          [task.parentTaskId]: existing.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
        };
      });
    };

    const handleSocketTaskDeleted = ({ taskId }) => {
      setSubtasksMap((prev) => {
        const next = { ...prev };
        // If the deleted task was a parent, remove its subtask list
        delete next[taskId];
        // If it was a subtask, remove it from its parent's list
        for (const parentId of Object.keys(next)) {
          const filtered = next[parentId].filter((t) => t.id !== taskId);
          if (filtered.length !== next[parentId].length) {
            next[parentId] = filtered;
          }
        }
        return next;
      });
      // Collapse if the deleted task was expanded
      setExpandedTaskIds((prev) => {
        if (!prev.has(taskId)) return prev;
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      // Clear addingSubtaskFor if it was for the deleted task
      setAddingSubtaskFor((prev) => (prev === taskId ? null : prev));
    };

    const handleSocketTaskPositionsUpdated = ({ updates }) => {
      if (!updates?.length) return;
      setSubtasksMap((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const parentId of Object.keys(next)) {
          const subtasks = next[parentId];
          if (!subtasks?.length) continue;
          const updateMap = new Map(
            updates
              .filter((u) => subtasks.some((t) => t.id === u.taskId))
              .map((u) => [u.taskId, u])
          );
          if (updateMap.size === 0) continue;
          changed = true;
          next[parentId] = subtasks
            .map((t) => {
              const u = updateMap.get(t.id);
              if (!u) return t;
              const updated = { ...t, position: u.position, statusId: u.statusId };
              if (u.sectionId !== undefined) updated.sectionId = u.sectionId;
              return updated;
            })
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        }
        return changed ? next : prev;
      });
    };

    socketService.on("task:created", handleSocketTaskCreated);
    socketService.on("task:updated", handleSocketTaskUpdated);
    socketService.on("task:deleted", handleSocketTaskDeleted);
    socketService.on("task:positions_updated", handleSocketTaskPositionsUpdated);

    return () => {
      socketService.off("task:created", handleSocketTaskCreated);
      socketService.off("task:updated", handleSocketTaskUpdated);
      socketService.off("task:deleted", handleSocketTaskDeleted);
      socketService.off("task:positions_updated", handleSocketTaskPositionsUpdated);
    };
  }, [projectId, tasks, onTaskUpdated]);

  // ── Subtask handlers ───────────────────────────────────────────────────────

  const handleToggleExpand = useCallback(async (taskId) => {
    const isExpanded = expandedTaskIds.has(taskId);
    if (isExpanded) {
      setExpandedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      setAddingSubtaskFor((prev) => (prev === taskId ? null : prev));
      return;
    }
    // Expand: fetch subtasks if not already loaded
    setExpandedTaskIds((prev) => new Set([...prev, taskId]));
    if (!subtasksMap[taskId]) {
      try {
        const res = await taskService.getSubtasks(taskId);
        setSubtasksMap((prev) => ({ ...prev, [taskId]: res.data.data ?? [] }));
      } catch {
        // On error collapse again
        setExpandedTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    }
  }, [expandedTaskIds, subtasksMap]);

  const handleAddSubtask = useCallback((taskId) => {
    // Ensure parent is expanded first
    if (!expandedTaskIds.has(taskId)) {
      setExpandedTaskIds((prev) => new Set([...prev, taskId]));
      if (!subtasksMap[taskId]) {
        taskService.getSubtasks(taskId)
          .then((res) => setSubtasksMap((prev) => ({ ...prev, [taskId]: res.data.data ?? [] })))
          .catch(() => {});
      }
    }
    setAddingSubtaskFor(taskId);
    setActiveInlineArea(null); // close any root task inline row
  }, [expandedTaskIds, subtasksMap]);

  const handleSubtaskCreated = useCallback((parentTaskId, subtask) => {
    // ID is already in locallyCreatedSubtaskIds (registered by onSilentSave before
    // the buffer flush). No need to add it again here.
    setSubtasksMap((prev) => ({
      ...prev,
      [parentTaskId]: [...(prev[parentTaskId] ?? []), subtask],
    }));
    setAddingSubtaskFor(null);
    // Update parent's subtaskCount in the root tasks state
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    if (parentTask) {
      onTaskUpdated?.({ ...parentTask, subtaskCount: (parentTask.subtaskCount ?? 0) + 1 });
    }
  }, [tasks, onTaskUpdated]);

  // ── Task delete ────────────────────────────────────────────────────────────

  const handleDeleteTask = useCallback(async (taskId, parentTaskId) => {
    try {
      await taskService.deleteTask(taskId);
      if (parentTaskId) {
        // Deleted a subtask — remove from subtasksMap and decrement parent count
        setSubtasksMap((prev) => {
          const existing = prev[parentTaskId] ?? [];
          return { ...prev, [parentTaskId]: existing.filter((t) => t.id !== taskId) };
        });
        const parentTask = tasks.find((t) => t.id === parentTaskId);
        if (parentTask) {
          onTaskUpdated?.({ ...parentTask, subtaskCount: Math.max(0, (parentTask.subtaskCount ?? 1) - 1) });
        }
      } else {
        // Deleted a root task — remove its subtask state and notify parent
        setSubtasksMap((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
        setExpandedTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
        onTaskDeleted?.(taskId);
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  }, [tasks, onTaskUpdated, onTaskDeleted]);

  // ── Type conversion ────────────────────────────────────────────────────────
  // The actual API call is handled inside TaskRow (optimistic update).
  // onUpdated from TaskRow flows to onTaskUpdated which updates ProjectPage state.
  // No extra handler needed here — TaskRow calls onUpdated directly.

  // ── Inline row ─────────────────────────────────────────────────────────────

  const openInline = (area) => {
    if (!can("create_task")) { denyToast(); return; }
    setActiveInlineArea(area);
    setAddingSubtaskFor(null); // close any open subtask input
  };
  const closeInline = () => setActiveInlineArea(null);

  const handleInlineCreated = (newTask) => {
    onTaskCreated?.(newTask);
    closeInline();
  };

  // ── Section CRUD ───────────────────────────────────────────────────────────

  const handleSectionCreated = (section) => {
    onSectionCreated?.(section);
    setShowAddSection(false);
  };

  const handleSectionUpdated = useCallback((updated) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    onSectionUpdated?.(updated);
  }, [onSectionUpdated]);

  const handleToggleCollapse = (sectionId) => {
    setCollapsedMap((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleMoveSection = useCallback(async (sectionId, direction) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const reordered = [...sections];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
    setSections(reordered);
    try {
      await sectionService.reorderSections(projectId, reordered.map((s) => s.id));
    } catch {
      setSections(sections);
    }
  }, [sections, projectId]);

  const confirmDeleteOnly = async (section) => {
    try {
      await sectionService.deleteSection(projectId, section.id);
      onSectionDeleted?.(section.id, []);
    } catch {}
  };

  const openDeleteWithTasks = async (section) => {
    let count = 0;
    try {
      const res = await sectionService.getSectionTaskCount(projectId, section.id);
      count = res.data.data.count ?? 0;
    } catch {}
    setDeleteTarget({ section, taskCount: count });
  };

  const confirmDeleteWithTasks = async () => {
    if (!deleteTarget) return;
    try {
      await sectionService.deleteSectionWithTasks(projectId, deleteTarget.section.id);
      onSectionDeleted?.(deleteTarget.section.id, null);
    } catch {}
    setDeleteTarget(null);
  };

  // ── Detail panel ───────────────────────────────────────────────────────────

  const handleOpenDetail = (taskId) => {
    closeInline();
    setSelectedTaskId(taskId);
  };

  // ── Prop builders ──────────────────────────────────────────────────────────

  const taskRowProps = (task) => ({
    task,
    projectId,
    projectMembers,
    customFields,
    visibleFieldIds,
    fieldValues: fieldValuesMap[task.id] ?? [],
    onUpdated: onTaskUpdated,
    onOpenDetail: handleOpenDetail,
    expanded: expandedTaskIds.has(task.id),
    onToggleExpand: handleToggleExpand,
    onAddSubtask: handleAddSubtask,
    onDeleteTask: handleDeleteTask,
  });

  const subtaskRowProps = (subtask) => ({
    task: subtask,
    projectId,
    projectMembers,
    customFields: [],
    visibleFieldIds: [],
    fieldValues: [],
    onUpdated: (updated) => {
      // Update subtask in local map
      setSubtasksMap((prev) => {
        const parentId = subtask.parentTaskId;
        const existing = prev[parentId];
        if (!existing) return prev;
        return { ...prev, [parentId]: existing.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) };
      });
      // Also propagate to parent if needed (e.g. subtask completed changes)
    },
    onOpenDetail: handleOpenDetail,
    isSubtask: true,
    onDeleteTask: handleDeleteTask,
  });

  const inlineRowProps = (areaId) => ({
    statusId: defaultStatusId,
    sectionId: areaId === UNSECTIONED_DROP_ID ? null : areaId,
    projectId,
    projectMembers,
    colCount,
    onCreated: handleInlineCreated,
    onBeforeCreate: onTaskBeforeCreate,
    onSilentSave: onTaskSilentSave,
    onClose: closeInline,
    onOpenDetail: handleOpenDetail,
  });

  // ── Section drag-and-drop (native HTML5 DnD) ──────────────────────────────
  //
  // Why refs instead of state in the handlers:
  // The browser fires the first "dragover" event synchronously, before React
  // has flushed the setState from "dragstart". Reading state inside dragover
  // always returns null on the first event, so e.preventDefault() is never
  // called, the browser sees the drag as invalid and cancels it immediately.
  // Refs are written synchronously and readable immediately in any event handler.

  const setDragState = useCallback((id, idx) => {
    draggingSectionIdRef.current = id;
    sectionDropIndexRef.current = idx;
    setDraggingSectionId(id);
    setSectionDropIndex(idx);
  }, []);

  // Called from SectionRow's drag handle onDragStart.
  // nativeEvent is the raw DragEvent so we can attach a custom drag image.
  const handleSectionDragStart = useCallback((sectionId, nativeEvent, rowEl) => {
    // Write ref synchronously — readable by the very next dragover event
    draggingSectionIdRef.current = sectionId;
    sectionDropIndexRef.current = null;
    setDraggingSectionId(sectionId);
    setSectionDropIndex(null);

    // Custom drag image: clone the whole section row element so it looks like
    // a solid lifted card matching the screenshot, instead of the browser ghost.
    if (rowEl && nativeEvent.dataTransfer) {
      const clone = rowEl.cloneNode(true);
      // Style the clone as a lifted card
      Object.assign(clone.style, {
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: `${rowEl.offsetWidth}px`,
        background: "#ffffff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        borderRadius: "6px",
        border: "1px solid #e5e7eb",
        opacity: "1",
        pointerEvents: "none",
        zIndex: "9999",
      });
      document.body.appendChild(clone);
      nativeEvent.dataTransfer.setDragImage(clone, 20, 16);
      // Remove after next tick — browser has captured the image by then
      requestAnimationFrame(() => document.body.removeChild(clone));
    }
  }, []);

  const handleSectionDragEnd = useCallback(() => {
    setDragState(null, null);
  }, [setDragState]);

  // makeSectionDragOver(sectionIndex) returns a handler for a specific section.
  // Guard: only active while a section drag is in progress (ref is non-null) —
  // task drags leave draggingSectionIdRef null so this returns immediately,
  // letting @hello-pangea/dnd handle task drags without interference.
  const makeSectionDragOver = useCallback((sectionIndex) => (e) => {
    if (!draggingSectionIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const insertBefore = e.clientY < rect.top + rect.height / 2;
    const next = insertBefore ? sectionIndex : sectionIndex + 1;
    if (sectionDropIndexRef.current !== next) {
      sectionDropIndexRef.current = next;
      setSectionDropIndex(next);
    }
  }, []);

  // Single drop handler shared by all zones — reads from refs for consistency.
  const handleSectionDrop = useCallback(async (e) => {
    e.preventDefault();
    const dragId = draggingSectionIdRef.current;
    const dropIdx = sectionDropIndexRef.current;

    // Reset state immediately so UI snaps back cleanly on any exit path
    setDragState(null, null);

    if (!dragId || dropIdx === null) return;

    const current = sectionsRef.current;
    const srcIdx = current.findIndex((s) => s.id === dragId);
    if (srcIdx === -1 || dropIdx === srcIdx || dropIdx === srcIdx + 1) return;

    const reordered = current.filter((s) => s.id !== dragId);
    const insertAt = dropIdx > srcIdx ? dropIdx - 1 : dropIdx;
    reordered.splice(insertAt, 0, current[srcIdx]);

    const prevSections = [...current];
    setSections(reordered);  // optimistic update

    try {
      await sectionService.reorderSections(projectId, reordered.map((s) => s.id));
    } catch {
      setSections(prevSections);  // revert on API error
    }
  }, [projectId, setDragState]);

  // ── Task drag-and-drop ─────────────────────────────────────────────────────

  const handleDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const srcDropId = source.droppableId;
    const dstDropId = destination.droppableId;
    const srcSectionId = srcDropId === UNSECTIONED_DROP_ID ? null : srcDropId;
    const dstSectionId = dstDropId === UNSECTIONED_DROP_ID ? null : dstDropId;

    const srcTasks = srcDropId === UNSECTIONED_DROP_ID
      ? [...unsectionedTasks]
      : [...(tasksBySection[srcDropId] ?? [])];
    const isSameArea = srcDropId === dstDropId;
    const dstTasks = isSameArea
      ? srcTasks
      : (dstDropId === UNSECTIONED_DROP_ID
        ? [...unsectionedTasks]
        : [...(tasksBySection[dstDropId] ?? [])]);

    const movedTask = srcTasks.find((t) => t.id === draggableId);
    if (!movedTask) return;

    const newSrc = srcTasks.filter((t) => t.id !== draggableId);
    const newDst = isSameArea ? newSrc : [...dstTasks];
    newDst.splice(destination.index, 0, { ...movedTask, sectionId: dstSectionId });

    const updates = [];
    if (!isSameArea) {
      newSrc.forEach((t, i) =>
        updates.push({ taskId: t.id, statusId: t.statusId, position: i, sectionId: srcSectionId })
      );
    }
    newDst.forEach((t, i) =>
      updates.push({ taskId: t.id, statusId: t.statusId, position: i, sectionId: dstSectionId })
    );

    onTaskUpdated?.({ ...movedTask, sectionId: dstSectionId });

    try {
      await taskService.bulkUpdatePositions(updates);
    } catch {
      onTaskUpdated?.({ ...movedTask, sectionId: srcSectionId });
    }
  }, [unsectionedTasks, tasksBySection, onTaskUpdated]);

  // ── Subtask drag-and-drop (native HTML5, scoped per parent task) ──────────

  const handleSubtaskDragStart = useCallback((subtask, nativeEvent, rowEl) => {
    if (!subtask?.parentTaskId) return;
    setSubtaskDrag({
      draggingSubtaskId: subtask.id,
      parentTaskId: subtask.parentTaskId,
      dropIndex: null,
    });

    if (rowEl && nativeEvent.dataTransfer) {
      const clone = rowEl.cloneNode(true);
      Object.assign(clone.style, {
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: `${rowEl.offsetWidth}px`,
        background: "#ffffff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        borderRadius: "6px",
        border: "1px solid #e5e7eb",
        opacity: "1",
        pointerEvents: "none",
        zIndex: "9999",
      });
      document.body.appendChild(clone);
      nativeEvent.dataTransfer.effectAllowed = "move";
      nativeEvent.dataTransfer.setDragImage(clone, 20, 16);
      requestAnimationFrame(() => document.body.removeChild(clone));
    }
  }, [setSubtaskDrag]);

  const handleSubtaskDragEnd = useCallback(() => {
    setSubtaskDrag({ draggingSubtaskId: null, parentTaskId: null, dropIndex: null });
  }, [setSubtaskDrag]);

  const makeSubtaskDragOver = useCallback((parentTaskId, index) => (e) => {
    const current = subtaskDragStateRef.current;
    if (!current.draggingSubtaskId || current.parentTaskId !== parentTaskId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const insertBefore = e.clientY < rect.top + rect.height / 2;
    const nextIndex = insertBefore ? index : index + 1;
    if (current.dropIndex !== nextIndex) {
      setSubtaskDrag({ ...current, dropIndex: nextIndex });
    }
  }, [setSubtaskDrag]);

  const handleSubtaskDrop = useCallback(async (parentTaskId) => {
    const current = subtaskDragStateRef.current;
    const { draggingSubtaskId, parentTaskId: draggingParentId, dropIndex } = current;
    setSubtaskDrag({ draggingSubtaskId: null, parentTaskId: null, dropIndex: null });

    if (!draggingSubtaskId || draggingParentId !== parentTaskId || dropIndex === null) return;
    const source = subtasksMap[parentTaskId] ?? [];
    const srcIndex = source.findIndex((t) => t.id === draggingSubtaskId);
    if (srcIndex === -1 || dropIndex === srcIndex || dropIndex === srcIndex + 1) return;

    const reordered = source.filter((t) => t.id !== draggingSubtaskId);
    const insertAt = dropIndex > srcIndex ? dropIndex - 1 : dropIndex;
    reordered.splice(insertAt, 0, source[srcIndex]);

    setSubtasksMap((prev) => ({ ...prev, [parentTaskId]: reordered }));
    const updates = reordered.map((t, i) => ({
      taskId: t.id,
      statusId: t.statusId,
      position: i,
      sectionId: t.sectionId ?? null,
    }));

    try {
      await taskService.bulkUpdatePositions(updates);
    } catch {
      setSubtasksMap((prev) => ({ ...prev, [parentTaskId]: source }));
    }
  }, [subtasksMap, setSubtaskDrag]);

  // ── Shared "Add task…" row ─────────────────────────────────────────────────

  const renderAddTaskTrigger = (areaId) => {
    if (!can("create_task")) return null;
    return (
      <tr>
        <td colSpan={colCount + 1} className="py-1.5 pl-10">
          <button
            onClick={() => openInline(areaId)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add task…
          </button>
        </td>
      </tr>
    );
  };

  // ── Subtask rows renderer ──────────────────────────────────────────────────
  // Renders the expanded subtask rows + inline add input for a given parent task.

  const renderSubtaskRows = (parentTask) => {
    if (!expandedTaskIds.has(parentTask.id)) return null;
    const subtasks = subtasksMap[parentTask.id] ?? [];
    const isDraggingHere = subtaskDragState.parentTaskId === parentTask.id;

    return (
      <>
        {isDraggingHere && subtaskDragState.dropIndex === 0 && (
          <tr>
            <td colSpan={colCount + 1} className="p-0">
              <div className="h-0.5 bg-indigo-500 ml-16 mr-2" />
            </td>
          </tr>
        )}

        {subtasks.map((subtask, index) => (
          <React.Fragment key={subtask.id}>
            <TaskRow
              {...subtaskRowProps(subtask)}
              onSubtaskDragStart={handleSubtaskDragStart}
              onSubtaskDragEnd={handleSubtaskDragEnd}
              rowProps={{
                onDragOver: makeSubtaskDragOver(parentTask.id, index),
                onDrop: (e) => { e.preventDefault(); handleSubtaskDrop(parentTask.id); },
                style: {
                  opacity: subtaskDragState.draggingSubtaskId === subtask.id ? 0.4 : 1,
                },
              }}
            />
            {isDraggingHere && subtaskDragState.dropIndex === index + 1 && (
              <tr>
                <td colSpan={colCount + 1} className="p-0">
                  <div className="h-0.5 bg-indigo-500 ml-16 mr-2" />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}

        {addingSubtaskFor === parentTask.id && (
          <InlineTaskRow
            key={subtaskInputKey}
            parentTaskId={parentTask.id}
            statusId={defaultStatusId}
            sectionId={parentTask.sectionId ?? null}
            projectId={projectId}
            projectMembers={projectMembers}
            colCount={colCount}
            isSubtask
            onCreated={(newSubtask) => handleSubtaskCreated(parentTask.id, newSubtask)}
            onBeforeCreate={() => { pendingSubtaskCreateCount.current += 1; }}
            onSilentSave={(taskId) => {
              // Register the ID so the buffered socket echo is suppressed
              if (taskId !== null) locallyCreatedSubtaskIds.current.add(taskId);
              pendingSubtaskCreateCount.current = Math.max(0, pendingSubtaskCreateCount.current - 1);
              // Flush buffer once all in-flight creates have resolved
              if (pendingSubtaskCreateCount.current === 0) {
                const buffered = subtaskSocketBuffer.current;
                subtaskSocketBuffer.current = [];
                setSubtasksMap((prev) => {
                  let next = prev;
                  for (const t of buffered) {
                    if (locallyCreatedSubtaskIds.current.has(t.id)) continue; // our own echo
                    if (!expandedTaskIdsRef.current.has(t.parentTaskId)) continue;
                    const existing = next[t.parentTaskId] ?? [];
                    if (existing.find((x) => x.id === t.id)) continue;
                    next = { ...next, [t.parentTaskId]: [...existing, t] };
                  }
                  return next;
                });
              }
            }}
            onClose={() => setAddingSubtaskFor(null)}
            onOpenDetail={handleOpenDetail}
          />
        )}
        <tr>
          <td colSpan={colCount + 1} className="py-1 pl-16">
            <button
              onClick={() => {
                setSubtaskInputKey((k) => k + 1);
                setAddingSubtaskFor(parentTask.id);
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add subtask…
            </button>
          </td>
        </tr>
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <button
          onClick={() => openInline(UNSECTIONED_DROP_ID)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
        <span className="text-xs text-gray-400">{tasks.length} tasks</span>
      </div>

      {/* Scrollable table area */}
      {/* onDragOver/onDrop here are the fallback for the whole container —
          they prevent the browser from cancelling a section drag when the
          cursor moves over areas that have no specific section drop handler
          (thead, unsectioned tbody, gaps between rows). */}
      <div
        className="flex-1 overflow-y-auto"
        onDragOver={(e) => { if (draggingSectionIdRef.current) e.preventDefault(); }}
        onDrop={handleSectionDrop}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <table className="w-full border-collapse table-fixed">

            {/* Sticky header row */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 py-2 pl-10 pr-2 w-130 border-r border-gray-200">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-45 border-r border-gray-200">
                  Assignee
                </th>
                <th className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-32.5 border-r border-gray-200">
                  Due date
                </th>
                {visibleFields.map((field) => (
                  <th
                    key={field.id}
                    title={field.name}
                    className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-33 overflow-hidden border-r border-gray-200"
                  >
                    <span className="flex items-center gap-1 overflow-hidden">
                      <span className="text-gray-400 shrink-0">{FIELD_TYPE_ICONS[field.type]}</span>
                      <span className="truncate pr-2">{field.name}</span>
                    </span>
                  </th>
                ))}
                <th className="py-2 px-2 w-8 text-right">
                  <button
                    ref={addFieldBtnRef}
                    onClick={() => guard("manage_project_settings", () => setShowAddField((v) => !v))}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded hover:bg-gray-100"
                    title="Add custom field"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </th>
                <th />
              </tr>
            </thead>

            {/* ── Unsectioned tasks ──────────────────────────────────────────── */}
            <Droppable droppableId={UNSECTIONED_DROP_ID} type="TASK">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {unsectionedTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <Draggable draggableId={task.id} index={index}>
                        {(dp) => (
                          <TaskRow
                            {...taskRowProps(task)}
                            innerRef={dp.innerRef}
                            draggableProps={dp.draggableProps}
                            dragHandleProps={dp.dragHandleProps}
                          />
                        )}
                      </Draggable>
                      {renderSubtaskRows(task)}
                    </React.Fragment>
                  ))}
                  {provided.placeholder}

                  {activeInlineArea === UNSECTIONED_DROP_ID && (
                    <InlineTaskRow {...inlineRowProps(UNSECTIONED_DROP_ID)} />
                  )}
                  {renderAddTaskTrigger(UNSECTIONED_DROP_ID)}
                </tbody>
              )}
            </Droppable>

            {/* ── Sections ──────────────────────────────────────────────────── */}

            {/* Drop indicator before the first section */}
            {draggingSectionId && sectionDropIndex === 0 && (
              <tbody>
                <tr><td colSpan={colCount + 2} className="p-0"><div className="h-0.5 bg-indigo-500 mx-2" /></td></tr>
              </tbody>
            )}

            {sections.map((section, sectionIndex) => {
              const sectionTasks = tasksBySection[section.id] ?? [];
              const isCollapsed = !!collapsedMap[section.id];
              const isDragging = draggingSectionId === section.id;

              return (
                <React.Fragment key={section.id}>
                  {/* Section header */}
                  <tbody
                    style={{ opacity: isDragging ? 0.4 : 1 }}
                    onDragOver={makeSectionDragOver(sectionIndex)}
                    onDrop={handleSectionDrop}
                  >
                    <SectionRow
                      section={section}
                      projectId={projectId}
                      taskCount={sectionTasks.length}
                      collapsed={isCollapsed}
                      onToggle={() => handleToggleCollapse(section.id)}
                      onUpdated={handleSectionUpdated}
                      onDeleteOnly={() => confirmDeleteOnly(section)}
                      onDeleteWithTasks={() => openDeleteWithTasks(section)}
                      onAddTask={() => openInline(section.id)}
                      onMoveUp={sectionIndex > 0 ? () => handleMoveSection(section.id, "up") : null}
                      onMoveDown={sectionIndex < sections.length - 1 ? () => handleMoveSection(section.id, "down") : null}
                      colCount={colCount}
                      onSectionDragStart={handleSectionDragStart}
                      onSectionDragEnd={handleSectionDragEnd}
                    />
                  </tbody>

                  {/* Section tasks */}
                  {!isCollapsed && (
                    <Droppable droppableId={section.id} type="TASK">
                      {(provided) => (
                        <tbody
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{ opacity: isDragging ? 0.4 : 1 }}
                          onDragOver={makeSectionDragOver(sectionIndex)}
                          onDrop={handleSectionDrop}
                        >
                          {sectionTasks.map((task, taskIndex) => (
                            <React.Fragment key={task.id}>
                              <Draggable draggableId={task.id} index={taskIndex}>
                                {(dp) => (
                                  <TaskRow
                                    {...taskRowProps(task)}
                                    innerRef={dp.innerRef}
                                    draggableProps={dp.draggableProps}
                                    dragHandleProps={dp.dragHandleProps}
                                  />
                                )}
                              </Draggable>
                              {renderSubtaskRows(task)}
                            </React.Fragment>
                          ))}
                          {provided.placeholder}

                          {activeInlineArea === section.id && (
                            <InlineTaskRow {...inlineRowProps(section.id)} />
                          )}
                          {renderAddTaskTrigger(section.id)}
                        </tbody>
                      )}
                    </Droppable>
                  )}

                  {/* Drop indicator after this section */}
                  {draggingSectionId && sectionDropIndex === sectionIndex + 1 && (
                    <tbody>
                      <tr><td colSpan={colCount + 2} className="p-0"><div className="h-0.5 bg-indigo-500 mx-2" /></td></tr>
                    </tbody>
                  )}
                </React.Fragment>
              );
            })}

            {/* ── Add section ───────────────────────────────────────────────── */}
            <tbody
              onDragOver={makeSectionDragOver(sections.length)}
              onDrop={handleSectionDrop}
            >
              {showAddSection && (
                <AddSectionInlineRow
                  key={sectionInputKey}
                  projectId={projectId}
                  colCount={colCount}
                  onCreated={handleSectionCreated}
                  onCancel={() => setShowAddSection(false)}
                />
              )}
              <tr>
                <td colSpan={colCount + 1} className="py-3 pl-4">
                  <button
                    onClick={() => {
                      setSectionInputKey((k) => k + 1);
                      setShowAddSection(true);
                    }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add section
                  </button>
                </td>
              </tr>
            </tbody>

            {/* ── Timer SUM row ──────────────────────────────────────────── */}
            {(() => {
              const timerFields = visibleFields.filter(
                (f) => f.type === "estimated_time" || f.type === "actual_time"
              );
              if (timerFields.length === 0) return null;

              // Sum each timer field across all visible root tasks
              const allVisibleTasks = [
                ...unsectionedTasks,
                ...sections.flatMap((s) => tasksBySection[s.id] ?? []),
              ];

              return (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                    {/* Name col */}
                    <td className="py-1.5 pl-10 pr-2 text-xs font-medium text-gray-400 border-r border-gray-200">
                    </td>
                    {/* Assignee col */}
                    <td className="py-1.5 px-3 border-r border-gray-200" />
                    {/* Due date col */}
                    <td className="py-1.5 px-3 border-r border-gray-200" />
                    {/* Custom field cols */}
                    {visibleFields.map((field) => {
                      if (field.type !== "estimated_time" && field.type !== "actual_time") {
                        return <td key={field.id} className="py-1.5 px-2 border-r border-gray-200" />;
                      }
                      let sum = 0;
                      allVisibleTasks.forEach((t) => {
                        const vals = fieldValuesMap[t.id] ?? [];
                        const v = vals.find((v) => v.customFieldId === field.id);
                        if (v?.valueNumber) sum += Number(v.valueNumber);
                      });
                      // For actual_time, add elapsed from running timer if it targets this field
                      if (
                        field.type === "actual_time" &&
                        runningTimer?.customFieldId === field.id
                      ) {
                        sum += getElapsedMinutes(runningTimer.startedAt);
                      }
                      return (
                        <td key={field.id} className="py-1.5 px-2 border-r border-gray-200">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">SUM</span>
                            <span className="text-xs font-semibold text-gray-600">
                              {formatMinutes(sum) ?? "0m"}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tfoot>
              );
            })()}

          </table>
        </DragDropContext>
      </div>

      {/* Add custom field panel */}
      {showAddField && (
        <AddCustomFieldModal
          projectId={projectId}
          onCreated={handleFieldCreated}
          onClose={() => setShowAddField(false)}
          anchorRef={addFieldBtnRef}
          fieldCount={customFields.length}
        />
      )}

      {/* Delete section + tasks confirmation */}
      {deleteTarget && (
        <DeleteSectionModal
          sectionName={deleteTarget.section.name}
          taskCount={deleteTarget.taskCount}
          onConfirm={confirmDeleteWithTasks}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Task detail side panel */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={projectId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(task) => onTaskUpdated?.(task)}
        />
      )}
    </div>
  );
};

export default ListView;
