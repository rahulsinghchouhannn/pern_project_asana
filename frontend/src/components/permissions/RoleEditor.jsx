import { useState } from "react";
import Button from "@/components/ui/Button";

const PERMISSION_GROUPS = {
  Organization: [
    { key: "delete_organization", label: "Delete Organization" },
    { key: "manage_billing", label: "Manage Billing" },
    { key: "invite_user", label: "Invite Users" },
    { key: "remove_user", label: "Remove Users" },
    { key: "manage_roles", label: "Manage Roles" },
    { key: "view_org_settings", label: "View Org Settings" },
  ],
  Project: [
    { key: "create_project", label: "Create Project" },
    { key: "delete_project", label: "Delete Project" },
    { key: "update_project", label: "Update Project" },
    { key: "archive_project", label: "Archive Project" },
    { key: "manage_project_members", label: "Manage Project Members" },
    { key: "manage_project_settings", label: "Manage Project Settings" },
  ],
  Task: [
    { key: "create_task", label: "Create Task" },
    { key: "edit_task", label: "Edit Task" },
    { key: "delete_task", label: "Delete Task" },
    { key: "assign_task", label: "Assign Task" },
    { key: "reorder_task", label: "Reorder Task" },
  ],
  Comment: [
    { key: "create_comment", label: "Create Comment" },
    { key: "edit_comment", label: "Edit Comment" },
    { key: "delete_comment", label: "Delete Comment" },
  ],
  "Custom Fields": [
    { key: "manage_custom_fields", label: "Manage Custom Fields" },
  ],
};

const RoleEditor = ({ role, onSave, onCancel, isSaving }) => {
  const [name, setName] = useState(role?.name || "");
  const [selected, setSelected] = useState(new Set(role?.permissions || []));

  const toggle = (perm) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const handleSave = () => {
    onSave({ name, permissions: Array.from(selected) });
  };

  return (
    <div className="space-y-4">
      {!role?.isSystem && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
        <div key={group}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {group}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {perms.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggle(key)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" loading={isSaving} onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default RoleEditor;
