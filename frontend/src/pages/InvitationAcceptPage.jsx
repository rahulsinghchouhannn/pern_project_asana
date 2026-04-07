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

// ─── Icons ────────────────────────────────────────────────────────────────────

const InviteIcon = () => (
  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SuccessIcon = () => (
  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const InvitationAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token: authToken } = useAppSelector((s) => s.auth);

  const [acceptStatus, setAcceptStatus] = useState(STATUS.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null); // { organizationId, projectId }

  // ── Auto-accept: only runs when the user IS logged in ─────────────────────
  // The backend validates the token and returns the error if invalid/expired.
  useEffect(() => {
    if (!authToken || !token) return;
    if (acceptStatus !== STATUS.IDLE) return;

    setAcceptStatus(STATUS.LOADING);
    organizationService
      .acceptInvitation(token)
      .then((res) => {
        setResult(res.data.data); // { organizationId, projectId }
        setAcceptStatus(STATUS.SUCCESS);
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || "This invitation link is invalid or has expired.");
        setAcceptStatus(STATUS.ERROR);
      });
  }, [authToken, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redirect to project / workspace after success ─────────────────────────
  const handleGoToProject = async () => {
    if (result?.organizationId) {
      await dispatch(switchOrganization(result.organizationId));
    }
    navigate(result?.projectId ? `/projects/${result.projectId}` : "/");
  };

  // ── NOT logged in → show login / register immediately, no API call needed ──
  if (!authToken) {
    const redirectPath = `/invitations/accept/${token}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <InviteIcon />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">You&apos;ve been invited!</h1>
            <p className="text-sm text-gray-500">
              Sign in or create an account to accept this invitation and start collaborating.
            </p>
          </div>

          <div className="space-y-2">
            <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="block">
              <Button variant="primary" size="md" className="w-full justify-center">
                Log in
              </Button>
            </Link>
            <Link to={`/register?redirect=${encodeURIComponent(redirectPath)}`} className="block">
              <Button variant="secondary" size="md" className="w-full justify-center">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged in → show accept progress / result ─────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-4">

        {(acceptStatus === STATUS.IDLE || acceptStatus === STATUS.LOADING) && (
          <>
            <Spinner size="md" className="mx-auto" />
            <p className="text-gray-500 text-sm">Accepting invitation…</p>
          </>
        )}

        {acceptStatus === STATUS.SUCCESS && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <SuccessIcon />
            </div>
            <h1 className="text-xl font-bold text-gray-900">You&apos;re in!</h1>
            <p className="text-gray-500 text-sm">
              {result?.projectId
                ? "You now have access to the project."
                : "You've joined the organization."}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleGoToProject}
              className="w-full justify-center"
            >
              {result?.projectId ? "Go to project" : "Go to workspace"}
            </Button>
          </>
        )}

        {acceptStatus === STATUS.ERROR && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <ErrorIcon />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Invitation unavailable</h1>
            <p className="text-gray-500 text-sm">{errorMsg}</p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/")}
              className="w-full justify-center"
            >
              Go home
            </Button>
          </>
        )}

      </div>
    </div>
  );
};

export default InvitationAcceptPage;
