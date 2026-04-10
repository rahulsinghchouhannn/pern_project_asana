import { useEffect, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setPermissionsCache } from "@/store/slices/authSlice";
import permissionService from "@/services/permissionService";
import { useToast } from "@/components/ui/Toast";

const PERMISSION_DENIED_MSG = "You do not have permission to perform this action";

const usePermissions = (projectId = null) => {
  const dispatch = useAppDispatch();
  const { currentOrg, user, permissionsCache } = useAppSelector((s) => s.auth);
  const { show: showToast } = useToast();

  const cacheKey = `${currentOrg?.id ?? ""}:${projectId ?? ""}`;
  const cached = permissionsCache[cacheKey];

  // Track in-flight fetches to prevent duplicate requests for the same key
  const fetchingRef = useRef(new Set());

  useEffect(() => {
    if (!currentOrg?.id || !user) return;
    // Already cached — no fetch needed
    if (cached !== undefined) return;
    // Already fetching this key
    if (fetchingRef.current.has(cacheKey)) return;

    fetchingRef.current.add(cacheKey);
    permissionService
      .getMyPermissions(currentOrg.id, projectId)
      .then((res) => {
        dispatch(
          setPermissionsCache({
            key: cacheKey,
            permissions: res.data.data.permissions || [],
          })
        );
      })
      .catch(() => {
        dispatch(setPermissionsCache({ key: cacheKey, permissions: [] }));
      })
      .finally(() => {
        fetchingRef.current.delete(cacheKey);
      });
  }, [cacheKey, currentOrg?.id, user, cached, dispatch, projectId]);

  const permissions = cached ?? [];
  const isLoading = !currentOrg?.id || cached === undefined;

  const can = useCallback(
    (permission) => permissions.includes(permission),
    [permissions]
  );

  /**
   * Guard a permission-gated action.
   * If the user has the permission, calls fn() and returns its result.
   * Otherwise shows a permission toast and returns undefined.
   */
  const guard = useCallback(
    (permission, fn) => {
      if (permissions.includes(permission)) {
        return fn?.();
      }
      showToast(PERMISSION_DENIED_MSG, "error");
    },
    [permissions, showToast]
  );

  /**
   * Show the permission denied toast without gating a function.
   * Use when you need to show the toast from an event handler inline.
   */
  const denyToast = useCallback(() => {
    showToast(PERMISSION_DENIED_MSG, "error");
  }, [showToast]);

  return { can, guard, denyToast, permissions, isLoading };
};

export default usePermissions;
