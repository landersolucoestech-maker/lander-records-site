import { z } from "zod";

export const postSlugSchema = z.string().trim().min(1).max(160);
export const postStatusSchema = z.enum(["draft", "published", "archived"]);
