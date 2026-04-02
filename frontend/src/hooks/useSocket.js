import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/services/socketService";
import { addNotification, fetchUnreadCount } from "@/store/slices/appSlice";

const useSocket = () => {
  const dispatch = useAppDispatch();
  const { token, currentOrg } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!token || !currentOrg?.id) return;

    socketService.connect(token, currentOrg.id);

    const handleNewNotification = (notification) => {
      dispatch(addNotification(notification));
    };

    socketService.on("notification:new", handleNewNotification);

    // Fetch initial unread count
    dispatch(fetchUnreadCount());

    return () => {
      socketService.off("notification:new", handleNewNotification);
      socketService.disconnect();
    };
  }, [token, currentOrg?.id, dispatch]);
};

export default useSocket;
