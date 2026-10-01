import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpMediaUploadFromUrlInputSchema,
  McpMediaUploadOutputSchema,
} from "../schema/mcp-media.schema";
import {
  McpMediaUploadError,
  uploadMcpMediaFromUrl,
} from "../service/mcp-media.service";

const MEDIA_UPLOAD_REQUIRED_SCOPES: OAuthScopeRequest = {
  media: ["write"],
};

export const mediaUploadFromUrlTool = defineMcpTool({
  name: "media_upload_from_url",
  description:
    "Download a public HTTPS image and import it into the blog media library.",
  requiredScopes: MEDIA_UPLOAD_REQUIRED_SCOPES,
  inputSchema: McpMediaUploadFromUrlInputSchema,
  outputSchema: McpMediaUploadOutputSchema,
  async handler(args, context) {
    try {
      const output = await uploadMcpMediaFromUrl(context, args);
      return {
        content: [{ type: "text", text: `Uploaded image: ${output.url}` }],
        structuredContent: output,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text:
              error instanceof McpMediaUploadError
                ? error.message
                : "Could not import the image into the blog media library.",
          },
        ],
        isError: true,
      };
    }
  },
});
