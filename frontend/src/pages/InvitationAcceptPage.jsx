import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import organizationService from "@/services/organizationService";
import { switchOrganization } from "@/store/slices/authSlice";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

const InvitationAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token: authToken } = useAppSelector((s) => s.auth);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const [orgId, setOrgId] = useState(null);

  const acceptInvite = async () => {
    setStatus(STATUS.LOADING);
    try {
      const response = await organizationService.acceptInvitation(token);
      const { organizationId } = response.data.data;
      setOrgId(organizationId);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to accept invitation");
      setStatus(STATUS.ERROR);
    }
  };

  useEffect(() => {
    if (authToken && token) {
      acceptInvite();
    }
  }, [authToken, token]);

  const handleGoToOrg = async () => {
    if (orgId) await dispatch(switchOrganization(orgId));
    navigate("/");
  };

  if (!authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">You&apos;ve been invited!</h1>
          <p className="text-gray-500 text-sm">
            Sign in or create an account to accept this invitation.
          </p>
          <div className="space-y-2">
            <Link to={`/login?redirect=/invitations/accept/${token}`}>
              <Button variant="primary" size="md" className="w-full justify-center">
                Log in
              </Button>
            </Link>
            <Link to={`/register?redirect=/invitations/accept/${token}`}>
              <Button variant="secondary" size="md" className="w-full justify-center">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-4">
        {status === STATUS.LOADING && (
          <>
            <Spinner size="md" className="mx-auto" />
            <p className="text-gray-500 text-sm">Accepting invitation…</p>
          </>
        )}

        {status === STATUS.SUCCESS && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">You&apos;re in!</h1>
            <p className="text-gray-500 text-sm">Invitation accepted. You&apos;ve joined the organization.</p>
            <Button variant="primary" size="md" onClick={handleGoToOrg} className="w-full justify-center">
              Go to workspace
            </Button>
          </>
        )}

        {status === STATUS.ERROR && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Invitation failed</h1>
            <p className="text-gray-500 text-sm">{errorMsg}</p>
            <Button variant="secondary" size="md" onClick={() => navigate("/")} className="w-full justify-center">
              Go home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default InvitationAcceptPage;
