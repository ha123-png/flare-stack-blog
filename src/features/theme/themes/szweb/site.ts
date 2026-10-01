import { zheyeIdentity } from "./identity";
export type { Chroma, Project } from "@/features/config/projects.schema";
import type { Chroma } from "@/features/config/projects.schema";
export const szwebSite = { domain: zheyeIdentity.domain };
export interface EditorialMedia {
  image: string;
  alt: string;
  accent?: Chroma;
}
export const editorialMedia: Record<string, EditorialMedia> = {};
export const isPublicTag = (name: string) =>
  !name.trim().toLowerCase().startsWith("_chroma:");
