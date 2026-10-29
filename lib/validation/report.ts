import { z } from "zod";

export const reportUpdateSchema = z
  .object({
    id: z.guid(),
    status: z.enum(["received", "investigating", "resolved"]),
    note: z.string().trim().max(1000, "Keep the note under 1,000 characters."),
  })
  .refine((v) => v.status !== "resolved" || v.note.length >= 5, {
    message: "Add a note on how the report was resolved (at least 5 characters).",
    path: ["note"],
  });

export type ReportUpdate = z.infer<typeof reportUpdateSchema>;
