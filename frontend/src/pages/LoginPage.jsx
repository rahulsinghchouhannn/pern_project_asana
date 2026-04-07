import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, requestMagicLink } from "@/store/slices/authSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

const STEP = {
  EMAIL: "email",
  PASSWORD: "password",
  MAGIC_SENT: "magic_sent",
};

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, error } = useAppSelector((s) => s.auth);

  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      const { organizations } = result.payload ?? {};
      if (organizations && organizations.length > 1) {
        // Preserve the redirect param through org selection
        navigate(`/select-org?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        navigate(redirectTo);
      }
    } else {
      setFormError(result.payload || "Login failed");
    }
  };

  const handleMagicLink = async () => {
    setFormError("");
    const result = await dispatch(requestMagicLink(email));
    if (requestMagicLink.fulfilled.match(result)) {
      setStep(STEP.MAGIC_SENT);
    } else {
      setFormError(result.payload || "Failed to send magic link");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 mb-4">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Log in to Asana</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {step === STEP.EMAIL && (
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                id="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={formError}
              />
              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  disabled={!email || isLoading}
                  onClick={() => setStep(STEP.PASSWORD)}
                >
                  Continue with password
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full justify-center"
                  disabled={!email || isLoading}
                  loading={isLoading}
                  onClick={handleMagicLink}
                >
                  Send magic link
                </Button>
              </div>
            </div>
          )}

          {step === STEP.PASSWORD && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => setStep(STEP.EMAIL)}
                  className="text-blue-600 hover:underline"
                >
                  Change
                </button>
              </div>
              <Input
                label="Password"
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={formError}
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                loading={isLoading}
                disabled={!password || isLoading}
              >
                Log in
              </Button>
              <button
                type="button"
                onClick={() => { setStep(STEP.EMAIL); handleMagicLink(); }}
                className="w-full text-center text-sm text-blue-600 hover:underline"
              >
                Send magic link instead
              </button>
            </form>
          )}

          {step === STEP.MAGIC_SENT && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
              </p>
              <button
                type="button"
                onClick={() => setStep(STEP.EMAIL)}
                className="text-sm text-blue-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
