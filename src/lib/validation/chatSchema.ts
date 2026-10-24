import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_HISTORY_ITEMS = 20;
export const MAX_HISTORY_CONTENT_LENGTH = 2000;
export const MAX_BODY_BYTES = 64 * 1024;

export const chatRequestSchema = z.object({
  message: z
    .string({ error: "Please type a question." })
    .trim()
    .min(1, "Please type a question.")
    .max(MAX_MESSAGE_LENGTH, `Questions can be up to ${MAX_MESSAGE_LENGTH} characters.`),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_HISTORY_CONTENT_LENGTH),
      }),
    )
    .max(MAX_HISTORY_ITEMS)
    .default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
