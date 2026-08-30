import { z } from "zod";

export const artistSlugSchema = z.string().trim().min(1).max(160);
export const artistStatusSchema = z.enum(["draft", "published", "inactive"]);
