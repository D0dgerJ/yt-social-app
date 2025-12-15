import { z } from "zod";

export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(120, "Title is too long"),

  description: z
    .string()
    .max(2000, "Description is too long")
    .optional(),

  startAt: z.string().datetime(),

  endAt: z.string().datetime().optional(),

  allDay: z.boolean().optional(),

  color: z.string().max(32).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const getEventsQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});
