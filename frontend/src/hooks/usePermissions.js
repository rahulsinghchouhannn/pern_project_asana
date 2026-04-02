import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import permissionService from "@/services/permissionService";

const usePermissions = (projectId = null) => {
  const { currentOrg, user } = useAppSelector((s) => s.auth);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg?.id || !user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    permissionService
      .getMyPermissions(currentOrg.id, projectId)
      .then((res) => {
        setPermissions(res.data.data.permissions || []);
      })
      .catch(() => {
        setPermissions([]);
      })
      .finally(() => setIsLoading(false));
  }, [currentOrg?.id, user, projectId]);

  const can = useCallback(
    (permission) => permissions.includes(permission),
    [permissions]
  );

  return { can, permissions, isLoading };
};

export default usePermissions;
