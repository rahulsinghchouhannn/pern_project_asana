import { useSelector, useDispatch } from "react-redux";
import { loginUser, logoutUser, registerUser } from "@/store/slices/authSlice";

const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isLoading, error } = useSelector((state) => state.auth);

  const login = (credentials) => dispatch(loginUser(credentials));
  const logout = () => dispatch(logoutUser());
  const register = (data) => dispatch(registerUser(data));

  return { user, token, isLoading, error, login, logout, register };
};

export default useAuth;
