// grpc/client.ts
import { createPromiseClient } from "@bufbuild/connect";
import { createConnectTransport } from "@bufbuild/connect-web";
import { mcp } from "../proto/mcp_pb"

// Setup a Connect-Web transport pointing to your gRPC-Web/Connect endpoint
const transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_GRPC_WEB_ENDPOINT!,
});

// Create a typed client for MCPService
export const mcpService = createPromiseClient(mcp.MCPService, transport);