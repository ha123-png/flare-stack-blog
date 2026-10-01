import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSiteConfig } from "../service/config.service";
import { getPostsCursor } from "@/features/posts/data/posts.data";
import { dbMiddleware } from "@/lib/middlewares";

export const getProjectPostsFn = createServerFn()
  .middleware([dbMiddleware])
  .inputValidator(
    z.object({
      projectId: z.string().max(60),
      cursor: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(50).default(12),
    }),
  )
  .handler(async ({ data, context }) => {
    const site = await getSiteConfig(context);
    const project = site.projects?.find((item) => item.id === data.projectId);
    if (!project) return { items: [], nextCursor: null };
    return getPostsCursor(context.db, {
      project,
      cursor: data.cursor,
      limit: data.limit,
      publicOnly: true,
    });
  });
