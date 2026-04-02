import api, { getOrgHeader } from "./api";

const commentService = {
  getTaskComments: (taskId) =>
    api.get(`/tasks/${taskId}/comments`, { headers: getOrgHeader() }),

  createComment: (taskId, content) =>
    api.post(`/tasks/${taskId}/comments`, { content }, { headers: getOrgHeader() }),

  updateComment: (commentId, content) =>
    api.put(`/comments/${commentId}`, { content }, { headers: getOrgHeader() }),

  deleteComment: (commentId) =>
    api.delete(`/comments/${commentId}`, { headers: getOrgHeader() }),
};

export default commentService;
