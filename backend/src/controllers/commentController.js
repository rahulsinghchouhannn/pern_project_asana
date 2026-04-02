const asyncHandler = require("../middleware/asyncHandler");
const commentService = require("../services/commentService");
const successResponse = require("../utils/successResponse");

const getTaskComments = asyncHandler(async (req, res) => {
  const comments = await commentService.getTaskComments(req.params.taskId);
  res.status(200).json(successResponse(comments));
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(
    req.params.taskId,
    req.user.userId,
    req.org.orgId,
    req.validated.content
  );
  res.status(201).json(successResponse(comment));
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(
    req.params.id,
    req.user.userId,
    req.validated.content
  );
  res.status(200).json(successResponse(comment));
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(
    req.params.id,
    req.user.userId,
    req.user.role
  );
  res.status(200).json(successResponse({ deleted: true }));
});

module.exports = { getTaskComments, createComment, updateComment, deleteComment };
