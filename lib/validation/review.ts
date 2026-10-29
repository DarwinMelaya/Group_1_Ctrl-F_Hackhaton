import { z } from "zod";

export const reviewSchema = z.object({
  id: z.guid(),
  status: z.enum(["reviewed", "verified"]),
  note: z.string().trim().min(5, "Add a short note on what was checked (at least 5 characters).").max(500, "Keep the note under 500 characters."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
