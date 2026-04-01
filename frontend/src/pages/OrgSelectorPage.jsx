import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { switchOrganization } from "@/store/slices/authSlice";
import organizationService from "@/services/organizationService";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

const roleColor = {
  owner: "purple",
  admin: "blue",
  member: "gray",
};

const OrgSelectorPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, organizations, isLoading } = useAppSelector((s) => s.auth);

  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleSelect = async (orgId) => {
    const result = await dispatch(switchOrganization(orgId));
    if (switchOrganization.fulfilled.match(result)) {
      navigate("/");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreateError("");
    setCreating(true);
    try {
      await organizationService.createOrganization({ name: orgName });
      navigate("/");
    } catch (err) {
      setCreateError(err.response?.data?.error || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 mb-4">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Select a workspace</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {user?.name}. Choose a workspace to continue.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner size="md" />
            </div>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{org.name}</p>
                  <p className="text-xs text-gray-500 truncate">{org.slug}</p>
                </div>
                <Badge color={roleColor[org.role] ?? "gray"} label={org.role} />
              </button>
            ))
          )}

          {/* Create new org */}
          <div className="px-6 py-4">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create new organization
              </button>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  label="Organization name"
                  type="text"
                  id="orgName"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  error={createError}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="sm" loading={creating}>
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowCreate(false); setOrgName(""); setCreateError(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgSelectorPage;
