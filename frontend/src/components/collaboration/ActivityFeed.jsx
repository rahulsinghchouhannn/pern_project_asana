import React, { useEffect, useState, useCallback } from "react";
import CommentItem from "./CommentItem";
import CommentBox from "./CommentBox";
import commentService from "@/services/commentService";
import activityService from "@/services/activityService";
import socketService from "@/services/socketService";
import usePermissions from "@/hooks/usePermissions";

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

const ACTION_LABELS = {
  task_created: (m) => `created this task`,
  task_completed: () => `marked task complete`,
  task_assigned: (m) => `assigned ${m?.assigneeName ?? "someone"}`,
  comment_added: () => `added a comment`,
  status_changed: (m) => m?.from && m?.to ? `changed status from "${m.from}" to "${m.to}"` : `changed status`,
  priority_changed: (m) => `changed priority`,
  due_date_changed: (m) => `changed due date`,
  project_created: (m) => `created project`,
  member_invited: (m) => m?.email ? `invited ${m.email}` : `invited a member`,
  member_joined: () => `joined the organization`,
};

const activityLabel = (action, metadata) => {
  const fn = ACTION_LABELS[action];
  return fn ? fn(metadata) : action.replace(/_/g, " ");
};

const ActivityFeed = ({ taskId, projectId, projectMembers = [], currentUserId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { can, denyToast } = usePermissions(projectId ?? null);

  const fetchActivity = useCallback(() => {
    if (!taskId) return;
    activityService
      .getTaskActivity(taskId)
      .then((res) => setItems(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Append new comments in real-time when this task's modal is open
  useEffect(() => {
    if (!taskId) return;
    const handler = (comment) => {
      if (comment.taskId === taskId) fetchActivity();
    };
    socketService.on("comment:added", handler);
    return () => socketService.off("comment:added", handler);
  }, [taskId, fetchActivity]);

  const handleSubmitComment = async (content) => {
    if (!can("create_comment")) { denyToast(); return; }
    setSubmitting(true);
    try {
      await commentService.createComment(taskId, content);
      fetchActivity();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId, content) => {
    if (!can("edit_comment")) { denyToast(); return; }
    try {
      await commentService.updateComment(commentId, content);
      fetchActivity();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!can("delete_comment")) { denyToast(); return; }
    try {
      await commentService.deleteComment(commentId);
      fetchActivity();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity</label>

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) =>
            item.type === "comment" ? (
              <li key={`c-${item.id}`}>
                <CommentItem
                  comment={item}
                  currentUserId={currentUserId}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              </li>
            ) : (
              <li key={`a-${item.id}`} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.actorAvatar ? (
                    <img src={item.actorAvatar} alt={item.actorName} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-medium text-gray-600">
                      {item.actorName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{item.actorName}</span>
                    {" "}
                    <span>{activityLabel(item.action, item.metadata)}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{relativeTime(item.createdAt)}</p>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="pt-2">
        <CommentBox
          projectMembers={projectMembers}
          onSubmit={handleSubmitComment}
          disabled={submitting}
        />
      </div>
    </div>
  );
};

export default ActivityFeed;
