import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  loginUser,
  logoutUser,
  registerUser,
  requestMagicLink,
  verifyMagicLink,
  setCurrentOrg,
} from "@/store/slices/authSlice";

const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, refreshToken, organizations, currentOrg, isLoading, error } =
    useAppSelector((state) => state.auth);

  return {
    user,
    token,
    refreshToken,
    organizations,
    currentOrg,
    isLoading,
    error,
    isAuthenticated: Boolean(token),
    login: (credentials) => dispatch(loginUser(credentials)),
    logout: () => dispatch(logoutUser()),
    register: (data) => dispatch(registerUser(data)),
    sendMagicLink: (email) => dispatch(requestMagicLink(email)),
    verifyMagicLink: (token) => dispatch(verifyMagicLink(token)),
    setCurrentOrg: (org) => dispatch(setCurrentOrg(org)),
  };
};

export default useAuth;
