import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { deleteOrganization } from "@/store/slices/authSlice";
import organizationService from "@/services/organizationService";
import permissionService from "@/services/permissionService";
import usePermissions from "@/hooks/usePermissions";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import RoleEditor from "@/components/permissions/RoleEditor";
import { useToast } from "@/components/ui/Toast";

const TAB_PARAM = "tab";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
];

const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const extractErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MembersTab = ({ orgId, can }) => {
  const { user: currentUser } = useAppSelector((s) => s.auth);
  const { show: showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingRole, setSavingRole] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      organizationService.getOrgMembers(orgId),
      organizationService.getOrgRoles(orgId),
    ])
      .then(([membersRes, rolesRes]) => {
        setMembers(membersRes.data.data || []);
        setRoles(rolesRes.data.data || []);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (userId, roleId) => {
    setSavingRole(userId);
    try {
      await organizationService.updateMemberRole(orgId, userId, roleId);
      const newRole = roles.find((r) => r.id === roleId);
      if (newRole) {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === userId ? { ...m, role: newRole.name.toLowerCase() } : m
          )
        );
      }
      showToast("Role updated", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setSavingRole(null);
    }
  };

  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from the organization?`)) return;
    setRemoving(userId);
    try {
      await organizationService.removeMember(orgId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      showToast("Member removed", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 text-sm mb-3">{error}</p>
      <Button variant="secondary" size="sm" onClick={fetchData}>Retry</Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Members</h2>
          <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {can("invite_user") && (
          <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
            Invite people
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-2 font-medium text-gray-600">Member</th>
              <th className="pb-2 font-medium text-gray-600">Role</th>
              {can("remove_user") && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => {
              const isCurrentUser = m.userId === currentUser?.id;
              const isOwner = m.role === "owner";
              return (
                <tr key={m.userId}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} className="w-8 h-8 rounded-full shrink-0" alt="" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold ${avatarColor(m.name)}`}>
                          {getInitials(m.name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">{m.name}</span>
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {can("manage_roles") && !isCurrentUser && !isOwner ? (
                      <select
                        value={roles.find((r) => r.name.toLowerCase() === m.role)?.id ?? ""}
                        onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                        disabled={savingRole === m.userId}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                      >
                        <option value="" disabled>{m.role || "—"}</option>
                        {roles
                          .filter((r) => r.name.toLowerCase() !== "owner")
                          .map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                      </select>
                    ) : (
                      <span className="text-gray-700 capitalize">{m.role || "—"}</span>
                    )}
                  </td>
                  {can("remove_user") && (
                    <td className="py-3 text-right">
                      {!isCurrentUser && !isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={removing === m.userId}
                          onClick={() => handleRemove(m.userId, m.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        orgId={orgId}
        onSuccess={fetchData}
      />
    </div>
  );
};

// ─── Roles Tab ────────────────────────────────────────────────────────────────

const RolesTab = ({ orgId, can }) => {
  const { show: showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(() => {
    setLoading(true);
    permissionService
      .getOrgRoles(orgId)
      .then((res) => setRoles(res.data.data || []))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleCreate = async ({ name, permissions }) => {
    setSaving(true);
    try {
      await permissionService.createRole(orgId, { name, permissions });
      setShowCreate(false);
      fetchRoles();
      showToast("Role created", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
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
      showToast("Role updated", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Delete this role? Users will be reassigned to Member.")) return;
    try {
      await permissionService.deleteRole(orgId, roleId);
      fetchRoles();
      showToast("Role deleted", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  // Owner role is never shown — it is system-managed and not manually assignable
  const visibleRoles = roles.filter((r) => r.name.toLowerCase() !== "owner");

  return (
    <div className="space-y-3">
      {can("manage_roles") && (
        <div className="flex justify-end mb-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
            + Add Custom Role
          </Button>
        </div>
      )}

      {visibleRoles.map((role) => (
        <div key={role.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{role.name}</span>
              {role.isSystem && (
                <Badge color="gray" label="System" />
              )}
            </div>
            {can("manage_roles") && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)}>
                  Edit
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(role.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
          </p>
        </div>
      ))}

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

// ─── Invite Modal ─────────────────────────────────────────────────────────────

const InviteModal = ({ isOpen, onClose, orgId, onSuccess }) => {
  const { show: showToast } = useToast();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState("");
  const [sending, setSending] = useState(false);

  const handleClose = () => {
    setEmail("");
    setEmailError("");
    setApiError("");
    onClose();
  };

  const validate = () => {
    if (!email.trim()) { setEmailError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSending(true);
    setApiError("");
    try {
      await organizationService.inviteUser(orgId, email.trim());
      showToast("Invitation sent", "success");
      handleClose();
      onSuccess();
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite people to your organization">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          The invitation link will be valid for 24 hours.
        </p>

        <Input
          label="Email address"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(""); setApiError(""); }}
          error={emailError}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          disabled={sending}
        />

        {apiError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {apiError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={sending}>
            Send invitation
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Invitations Tab ──────────────────────────────────────────────────────────

const InvitationsTab = ({ orgId, can }) => {
  const { show: showToast } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [resending, setResending] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const fetchInvitations = useCallback(() => {
    setLoading(true);
    setError(null);
    organizationService
      .getOrgInvitations(orgId)
      .then((res) => setInvitations(res.data.data || []))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const handleResend = async (invitationId) => {
    setResending(invitationId);
    try {
      await organizationService.resendInvitation(orgId, invitationId);
      showToast("Invitation resent", "success");
      fetchInvitations();
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setResending(null);
    }
  };

  const handleCancel = async (invitationId, email) => {
    if (!window.confirm(`Cancel the invitation for ${email}?`)) return;
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    setCancelling(invitationId);
    try {
      await organizationService.cancelInvitation(orgId, invitationId);
      showToast("Invitation cancelled", "success");
    } catch (err) {
      fetchInvitations();
      showToast(extractErrorMessage(err), "error");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 text-sm mb-3">{error}</p>
      <Button variant="secondary" size="sm" onClick={fetchInvitations}>Retry</Button>
    </div>
  );

  const pending = invitations.filter((inv) => inv.status === "pending");
  const past = invitations.filter((inv) => inv.status !== "pending");

  const badgeForStatus = (status) => {
    if (status === "accepted") return <Badge color="green" label="Accepted" />;
    if (status === "rejected") return <Badge color="red" label="Declined" />;
    return <Badge color="gray" label="Expired" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Invitations</h2>
        {can("invite_user") && (
          <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
            Invite people
          </Button>
        )}
      </div>

      {invitations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No invitations yet</h3>
          <p className="text-sm text-gray-400 mb-4">
            Invite teammates to collaborate in your organization.
          </p>
          {can("invite_user") && (
            <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
              Invite your first teammate
            </Button>
          )}
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending
          </h3>
          <div className="space-y-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold shrink-0">
                  {inv.invitedEmail[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{inv.invitedEmail}</p>
                  <p className="text-xs text-gray-400">
                    Invited by {inv.invitedByName} · {relativeTime(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <Badge color="yellow" label="Pending" />
                {can("invite_user") && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={resending === inv.id}
                      onClick={() => handleResend(inv.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancelling === inv.id}
                      onClick={() => handleCancel(inv.id, inv.invitedEmail)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Past invitations
          </h3>
          <div className="space-y-2">
            {past.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 opacity-60">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold shrink-0">
                  {inv.invitedEmail[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 text-sm truncate">{inv.invitedEmail}</p>
                  <p className="text-xs text-gray-400">
                    Invited by {inv.invitedByName} · {relativeTime(inv.createdAt)}
                  </p>
                </div>
                {badgeForStatus(inv.status)}
                {inv.status === "expired" && can("invite_user") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={resending === inv.id}
                    onClick={() => handleResend(inv.id)}
                  >
                    Resend
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        orgId={orgId}
        onSuccess={fetchInvitations}
      />
    </div>
  );
};

// ─── Billing Tab ──────────────────────────────────────────────────────────────

const BillingTab = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Billing & Plan</h2>
      <p className="text-sm text-gray-500">Manage your subscription and payment details.</p>
    </div>

    {/* Current plan card */}
    <div className="border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-gray-900">Free Plan</span>
            <Badge color="green" label="Active" />
          </div>
          <p className="text-sm text-gray-500">Up to 5 members · 3 projects · Basic features</p>
        </div>
        <Button variant="primary" size="sm" disabled>
          Upgrade — coming soon
        </Button>
      </div>
    </div>

    {/* Usage */}
    <div className="border border-gray-200 rounded-xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Usage</h3>
      {[
        { label: "Members", used: "—", limit: "5" },
        { label: "Projects", used: "—", limit: "3" },
        { label: "Storage", used: "—", limit: "1 GB" },
      ].map(({ label, used, limit }) => (
        <div key={label} className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-400">{used} / {limit}</span>
        </div>
      ))}
    </div>

    {/* Payment method */}
    <div className="border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment method</h3>
      <p className="text-sm text-gray-400">No payment method on file.</p>
      <Button variant="secondary" size="sm" className="mt-3" disabled>
        Add payment method — coming soon
      </Button>
    </div>
  </div>
);

// ─── Danger Zone ──────────────────────────────────────────────────────────────

const DangerZone = ({ orgId, orgName }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const { organizations } = useAppSelector((s) => s.auth);

  const [showModal, setShowModal] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmName !== orgName) return;
    setDeleting(true);
    try {
      await dispatch(deleteOrganization(orgId)).unwrap();
      showToast("Organization deleted", "success");
      // Navigate to next org or select-org if none left
      const remaining = organizations.filter((o) => o.id !== orgId);
      navigate(remaining.length > 0 ? "/" : "/select-org", { replace: true });
    } catch (err) {
      showToast(typeof err === "string" ? err : "Failed to delete organization", "error");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="border border-red-200 rounded-xl p-6 bg-red-50">
        <h2 className="text-base font-semibold text-red-700 mb-1">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete this organization and all its data. This action cannot be undone.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowModal(true)}
          className="border border-red-400 text-red-600 hover:bg-red-100"
        >
          Delete organization
        </Button>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setConfirmName(""); }} title="Delete organization">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently delete <strong>{orgName}</strong> and all associated projects,
            tasks, members, and settings. This action <strong>cannot be undone</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-semibold text-gray-900">{orgName}</span> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={orgName}
              disabled={deleting}
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => { setShowModal(false); setConfirmName(""); }} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={handleDelete}
              loading={deleting}
              disabled={confirmName !== orgName}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
            >
              Delete organization
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrgSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrg } = useAppSelector((s) => s.auth);
  const { can, isLoading } = usePermissions();

  // Build tabs dynamically based on permissions
  const tabs = [
    "Members",
    "Roles",
    ...(can("invite_user") ? ["Invitations"] : []),
    ...(can("manage_billing") ? ["Billing"] : []),
  ];

  const rawTab = searchParams.get(TAB_PARAM);
  const activeTab = tabs.includes(rawTab) ? rawTab : tabs[0];

  const setActiveTab = (tab) => {
    setSearchParams({ [TAB_PARAM]: tab }, { replace: true });
  };

  if (!currentOrg || isLoading) return (
    <div className="flex justify-center py-16"><Spinner /></div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Organization Settings
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
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
      {activeTab === "Billing" && (
        <BillingTab />
      )}

      {/* Danger Zone — only for owners (delete_organization permission) */}
      {can("delete_organization") && (
        <div className="mt-12">
          <DangerZone orgId={currentOrg.id} orgName={currentOrg.name} />
        </div>
      )}
    </div>
  );
};

export default OrgSettingsPage;
