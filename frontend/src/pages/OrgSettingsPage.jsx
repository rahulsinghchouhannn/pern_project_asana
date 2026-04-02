import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import organizationService from "@/services/organizationService";
import permissionService from "@/services/permissionService";
import usePermissions from "@/hooks/usePermissions";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import RoleEditor from "@/components/permissions/RoleEditor";
import Spinner from "@/components/ui/Spinner";

const TABS = ["Members", "Roles", "Invitations"];

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MembersTab = ({ orgId, can }) => {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    Promise.all([
      organizationService.getOrgMembers(orgId),
      permissionService.getOrgRoles(orgId),
    ])
      .then(([membersRes, rolesRes]) => {
        setMembers(membersRes.data.data || []);
        setRoles(rolesRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const handleRoleChange = async (userId, roleId) => {
    setSaving(userId);
    try {
      await permissionService.assignOrgRole(orgId, userId, roleId);
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this member from the organization?")) return;
    try {
      await organizationService.removeMember(orgId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      // error handled silently
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="pb-2 font-medium text-gray-600">Member</th>
            <th className="pb-2 font-medium text-gray-600">Email</th>
            <th className="pb-2 font-medium text-gray-600">Role</th>
            {can("remove_user") && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map((m) => (
            <tr key={m.userId}>
              <td className="py-3 flex items-center gap-2">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} className="w-7 h-7 rounded-full" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                    {m.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <span className="font-medium text-gray-800">{m.name}</span>
              </td>
              <td className="py-3 text-gray-500">{m.email}</td>
              <td className="py-3">
                {can("manage_roles") ? (
                  <select
                    defaultValue=""
                    onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                    disabled={saving === m.userId}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>{m.role || "—"}</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-700">{m.role || "—"}</span>
                )}
              </td>
              {can("remove_user") && (
                <td className="py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(m.userId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Roles Tab ────────────────────────────────────────────────────────────────

const RolesTab = ({ orgId, can }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = () => {
    setLoading(true);
    permissionService
      .getOrgRoles(orgId)
      .then((res) => setRoles(res.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoles(); }, [orgId]);

  const handleCreate = async ({ name, permissions }) => {
    setSaving(true);
    try {
      await permissionService.createRole(orgId, { name, permissions });
      setShowCreate(false);
      fetchRoles();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async ({ name, permissions }) => {
    setSaving(true);
    try {
      await permissionService.updateRole(orgId, editingRole.id, { name, permissions });
      setEditingRole(null);
      fetchRoles();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Delete this role? Users will be reassigned to Member.")) return;
    await permissionService.deleteRole(orgId, roleId);
    fetchRoles();
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <div key={role.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{role.name}</span>
              {role.isSystem && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  System
                </span>
              )}
            </div>
            {can("manage_roles") && !role.isSystem && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(role.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
          </p>
        </div>
      ))}

      {can("manage_roles") && (
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
          + Add Custom Role
        </Button>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Role">
        <RoleEditor
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          isSaving={saving}
        />
      </Modal>

      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Edit Role: ${editingRole?.name}`}
      >
        {editingRole && (
          <RoleEditor
            role={editingRole}
            onSave={handleUpdate}
            onCancel={() => setEditingRole(null)}
            isSaving={saving}
          />
        )}
      </Modal>
    </div>
  );
};

// ─── Invitations Tab ──────────────────────────────────────────────────────────

const InvitationsTab = ({ orgId, can }) => {
  return (
    <div className="text-sm text-gray-500 py-6 text-center">
      Invitations management coming soon.
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrgSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Members");
  const { currentOrg } = useAppSelector((s) => s.auth);
  const { can } = usePermissions();

  if (!currentOrg) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Organization Settings
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "Members" && (
        <MembersTab orgId={currentOrg.id} can={can} />
      )}
      {activeTab === "Roles" && (
        <RolesTab orgId={currentOrg.id} can={can} />
      )}
      {activeTab === "Invitations" && (
        <InvitationsTab orgId={currentOrg.id} can={can} />
      )}
    </div>
  );
};

export default OrgSettingsPage;
