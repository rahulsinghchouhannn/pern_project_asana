ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
