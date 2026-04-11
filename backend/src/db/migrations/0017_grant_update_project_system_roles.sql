-- Grant update_project to existing system Owner and Admin roles (new permission; not in historical seed data).
INSERT INTO "role_permissions" ("role_id", "permission")
SELECT r."id", 'update_project'
FROM "roles" r
WHERE r."is_system" = true
  AND r."name" IN ('Owner', 'Admin')
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permissions" rp
    WHERE rp."role_id" = r."id"
      AND rp."permission" = 'update_project'
  );
