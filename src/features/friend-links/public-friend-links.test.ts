import { describe, expect, it } from "vitest";
import {
  ApprovedFriendLinksResponseSchema,
  SubmitFriendLinkInputSchema,
} from "./friend-links.schema";

describe("approved friend link public boundary", () => {
  it("rejects executable submission URLs and neutralizes unsafe legacy display URLs", () => {
    const input = {
      siteName: "Unsafe",
      siteUrl: "javascript:alert(1)",
      contactEmail: "test@example.invalid",
    };
    expect(SubmitFriendLinkInputSchema.safeParse(input).success).toBe(false);
    const [publicLink] = ApprovedFriendLinksResponseSchema.parse([
      {
        ...input,
        id: 9,
        description: null,
        logoUrl: "data:text/html,unsafe",
        user: { image: "//outside.invalid/avatar" },
      },
    ]);
    expect(publicLink.siteUrl).toBe("#");
    expect(publicLink.logoUrl).toBeNull();
    expect(publicLink.user?.image).toBeNull();
  });
  it("strips private submission and moderation fields from old cache records", () => {
    const [result] = ApprovedFriendLinksResponseSchema.parse([
      {
        id: 7,
        siteName: "A friend's journal",
        siteUrl: "https://example.invalid",
        description: "Writing",
        logoUrl: null,
        userId: "private-user-id",
        contactEmail: "private@example.invalid",
        rejectionReason: "private moderation note",
        status: "approved",
        createdAt: "2026-01-01",
        updatedAt: "2026-02-01",
        user: {
          id: "private-user-id",
          name: "private account name",
          image: "/avatar.svg",
        },
      },
    ]);
    expect(result).toEqual({
      id: 7,
      siteName: "A friend's journal",
      siteUrl: "https://example.invalid",
      description: "Writing",
      logoUrl: null,
      user: { image: "/avatar.svg" },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /private|contactEmail|rejectionReason|userId/,
    );
  });
  it("keeps manually added links without an account or logo", () => {
    const [result] = ApprovedFriendLinksResponseSchema.parse([
      {
        id: 8,
        siteName: "Manual",
        siteUrl: "https://example.invalid",
        description: null,
        logoUrl: null,
        user: null,
      },
    ]);
    expect(result.user).toBeNull();
  });
});
