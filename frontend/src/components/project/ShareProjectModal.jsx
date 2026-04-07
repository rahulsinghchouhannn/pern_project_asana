import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import projectService from "@/services/projectService";
import { useToast } from "@/hooks/useToast";

const ShareProjectModal = ({ project, onClose }) => {
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentEmails, setSentEmails] = useState([]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      await projectService.inviteToProject(project.id, trimmed);
      setSentEmails((prev) => [...prev, trimmed]);
      show(`Invitation sent to ${trimmed}`, "success");
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title={`Share "${project.name}"`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Invite someone by email to collaborate on this project. They will receive an
          email with a link to view the project.
        </p>

        <form onSubmit={handleInvite} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Email address"
              type="email"
              id="invite-email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              error={error}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!email.trim() || loading}
            className="shrink-0 mb-0"
          >
            Invite
          </Button>
        </form>

        {sentEmails.length > 0 && (
          <div className="border border-gray-100 rounded-md divide-y divide-gray-100">
            {sentEmails.map((e) => (
              <div key={e} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-green-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="truncate">{e}</span>
                <span className="ml-auto text-gray-400 text-xs shrink-0">Invite sent</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareProjectModal;
