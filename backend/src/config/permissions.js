const PERMISSIONS = {
  // Organization-level
  DELETE_ORGANIZATION: "delete_organization",
  MANAGE_BILLING: "manage_billing",
  INVITE_USER: "invite_user",
  REMOVE_USER: "remove_user",
  MANAGE_ROLES: "manage_roles",
  VIEW_ORG_SETTINGS: "view_org_settings",

  // Project-level
  CREATE_PROJECT: "create_project",
  UPDATE_PROJECT: "update_project",
  DELETE_PROJECT: "delete_project",
  ARCHIVE_PROJECT: "archive_project",
  MANAGE_PROJECT_MEMBERS: "manage_project_members",
  MANAGE_PROJECT_SETTINGS: "manage_project_settings",

  // Task-level
  CREATE_TASK: "create_task",
  EDIT_TASK: "edit_task",
  DELETE_TASK: "delete_task",
  ASSIGN_TASK: "assign_task",
  REORDER_TASK: "reorder_task",

  // Comment-level
  CREATE_COMMENT: "create_comment",
  EDIT_COMMENT: "edit_comment",
  DELETE_COMMENT: "delete_comment",

  // Custom field-level
  MANAGE_CUSTOM_FIELDS: "manage_custom_fields",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const ADMIN_PERMISSIONS = ALL_PERMISSIONS.filter(
  (p) => p !== PERMISSIONS.DELETE_ORGANIZATION && p !== PERMISSIONS.MANAGE_BILLING
);

const MEMBER_PERMISSIONS = [
  PERMISSIONS.CREATE_TASK,
  PERMISSIONS.EDIT_TASK,
  PERMISSIONS.CREATE_COMMENT,
];

module.exports = { PERMISSIONS, ALL_PERMISSIONS, ADMIN_PERMISSIONS, MEMBER_PERMISSIONS };
