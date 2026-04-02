const { users } = require("./users");
const { organizations } = require("./organizations");
const { organizationMembers } = require("./organizationMembers");
const { invitations } = require("./invitations");
const { refreshTokens } = require("./refreshTokens");
const { projects } = require("./projects");
const { projectMembers } = require("./projectMembers");
const { projectStatuses } = require("./projectStatuses");
const { tasks } = require("./tasks");
const { taskAssignees } = require("./taskAssignees");
const { taskTags } = require("./taskTags");
const { taskHistory } = require("./taskHistory");
const { taskAttachments } = require("./taskAttachments");
const { customFields } = require("./customFields");
const { customFieldValues } = require("./customFieldValues");
const { roles } = require("./roles");
const { rolePermissions } = require("./rolePermissions");
const { userRoles } = require("./userRoles");
const { projectRoles } = require("./projectRoles");
const { comments } = require("./comments");
const { commentMentions } = require("./commentMentions");
const { activityLogs } = require("./activityLogs");
const { userActivityRead } = require("./userActivityRead");
const { notifications } = require("./notifications");

module.exports = {
  users,
  organizations,
  organizationMembers,
  invitations,
  refreshTokens,
  projects,
  projectMembers,
  projectStatuses,
  tasks,
  taskAssignees,
  taskTags,
  taskHistory,
  taskAttachments,
  customFields,
  customFieldValues,
  roles,
  rolePermissions,
  userRoles,
  projectRoles,
  comments,
  commentMentions,
  activityLogs,
  userActivityRead,
  notifications,
};
