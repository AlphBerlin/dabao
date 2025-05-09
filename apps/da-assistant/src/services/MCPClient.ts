import { Anthropic } from "@anthropic-ai/sdk";
import {
    MessageParam,
    Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import dotenv from "dotenv";
import { ChatMessage, ChatRequest, ChatResponse, CallToolRequest, CallToolResponse, ListToolsRequest, ListToolsResponse } from "../types";

dotenv.config(); // load environment variables from .env

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
}

export class MCPClient {
    private mcp: Client;
    private anthropic: Anthropic;
    private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];
    private isConnected: boolean = false;

    public isConnectedFn(): boolean {
        return this.isConnected;
    }

    constructor() {
        // Initialize Anthropic client and MCP client
        this.anthropic = new Anthropic({
            apiKey: ANTHROPIC_API_KEY,
        });
        this.mcp = new Client({ name: "mcp-client", version: "1.0.0" });
    }

    async connectToServer(serverScriptPath: string): Promise<void> {
        /**
         * Connect to an MCP server
         *
         * @param serverScriptPath - Path to the server script (.py or .js)
         */
        try {
            // Determine script type and appropriate command
            const isJs = serverScriptPath.endsWith(".js");
            const isPy = serverScriptPath.endsWith(".py");
            if (!isJs && !isPy) {
                throw new Error("Server script must be a .js or .py file");
            }
            const command = isPy
                ? process.platform === "win32"
                    ? "python"
                    : "python3"
                : process.execPath;

            // Initialize transport and connect to server
            this.transport = new StdioClientTransport({
                command,
                args: [serverScriptPath],
            });
            this.mcp.connect(this.transport);

            // List available tools
            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                };
            });
            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name),
            );
            
            this.isConnected = true;
            console.log("Connected to MCP server ", this.isConnected);
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            this.isConnected = false;
            throw e;
        }
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        /**
         * Process a chat request using Claude and available tools
         * 
         * @param request - The chat request containing messages, model, etc.
         * @returns A chat response object
         */
        console.log("isConnected: ", this.isConnected);

        if (!this.isConnected) {
            return {
                error: "Not connected to MCP server"
            };
        }

        try {
            const messages: MessageParam[] = request.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Initial Claude API call
            const response = await this.anthropic.messages.create({
                model: process.env.DEFAULT_MODEL || "claude-3-5-sonnet-20241022",
                max_tokens: request.max_tokens || (process.env.DEFAULT_MAX_TOKENS ? parseInt(process.env.DEFAULT_MAX_TOKENS) : 1000),
                messages,
                tools: this.tools,
            });

            // Process response and handle tool calls
            const finalText: string[] = [];
            const toolResults: any[] = [];

            for (const content of response.content) {
                if (content.type === "text") {
                    finalText.push(content.text);
                } else if (content.type === "tool_use") {
                    // Execute tool call
                    const toolName = content.name;
                    const toolArgs = content.input as { [x: string]: unknown } | undefined;

                    const result = await this.mcp.callTool({
                        name: toolName,
                        arguments: toolArgs,
                    });
                    toolResults.push(result);
                    finalText.push(
                        `[Tool result from ${toolName}: ${JSON.stringify(result)}]`,
                    );

                    // Continue conversation with tool results
                    messages.push({
                        role: "assistant",
                        content: finalText.join("\n"),
                    });
                    
                    messages.push({
                        role: "user",
                        content: result.content as string,
                    });

                    // Get next response from Claude
                    const followupResponse = await this.anthropic.messages.create({
                        model: request.model || process.env.DEFAULT_MODEL || "claude-3-5-sonnet-20241022",
                        max_tokens: request.max_tokens || (process.env.DEFAULT_MAX_TOKENS ? parseInt(process.env.DEFAULT_MAX_TOKENS) : 1000),
                        messages,
                    });

                    if (followupResponse.content[0]?.type === "text") {
                        finalText.push(followupResponse.content[0].text);
                    }
                }
            }

            return {
                message: {
                    role: 'assistant',
                    content: finalText.join("\n")
                }
            };
        } catch (error: any) {
            return {
                message: error.message,
                error: `Error processing chat request: ${error.message}`
            };
        }
    }

    async chatStream(request: ChatRequest): Promise<AsyncIterable<ChatResponse>> {
        /**
         * Process a chat request and stream responses
         * 
         * @param request - The chat request containing messages, model, etc.
         * @returns An async iterable of chat responses
         */
        if (!this.isConnected) {
            return (async function* () {
                yield {
                    error: "Not connected to MCP server"
                };
            })();
        }

        const self = this;
        return (async function* () {
            try {
                const messages: MessageParam[] = request.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                // Initial Claude API stream call
                const stream = await self.anthropic.messages.create({
                    model: request.model || process.env.DEFAULT_MODEL || "claude-3-5-sonnet-20241022",
                    max_tokens: request.max_tokens || (process.env.DEFAULT_MAX_TOKENS ? parseInt(process.env.DEFAULT_MAX_TOKENS) : 1000),
                    messages,
                    tools: self.tools,
                    stream: true,
                });

                // Process streaming response
                let toolCallStarted = false;
                let toolName = "";
                let toolInput = "";
                
                for await (const chunk of stream) {
                    // Handle text content blocks
                    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                        yield {
                            message: {
                                role: 'assistant',
                                content: chunk.delta.text
                            }
                        };
                    } 
                    // Handle tool use start
                    else if (chunk.type === "content_block_start" && chunk.content_block.type === "tool_use") {
                        toolCallStarted = true;
                        toolName = chunk.content_block.name;
                        toolInput = "";
                    } 
                    // Handle tool use input accumulation
                    else if (chunk.type === "content_block_delta" && chunk.delta.type === "input_json_delta" && toolCallStarted) {
                        // Accumulate tool input as string directly
                        // The delta content might be coming in different formats, so we'll handle it safely
                        if (chunk.delta) {
                            // Use a more type-safe approach to handle various delta formats
                            const deltaStr = JSON.stringify(chunk.delta);
                            if (deltaStr && deltaStr !== '{}') {
                                toolInput += deltaStr;
                            }
                        }
                    } 
                    // Handle tool call completion
                    else if (chunk.type === "content_block_stop" && toolCallStarted) {
                        // Tool call completed, execute it
                        toolCallStarted = false;
                        
                        try {
                            yield {
                                message: {
                                    role: 'assistant',
                                    content: `[Calling tool: ${toolName}]`
                                }
                            };
                            
                            const toolArgs = JSON.parse(toolInput);
                            const result = await self.mcp.callTool({
                                name: toolName,
                                arguments: toolArgs,
                            });
                            
                            yield {
                                message: {
                                    role: 'assistant',
                                    content: `[Tool result: ${result.content}]`
                                }
                            };
                            
                            // Continue conversation with tool results
                            messages.push({
                                role: "assistant",
                                content: `[Called tool: ${toolName}]`
                            });
                            
                            messages.push({
                                role: "user",
                                content: result.content as string,
                            });

                            // Get next response from Claude
                            const followupStream = await self.anthropic.messages.create({
                                model: request.model || process.env.DEFAULT_MODEL || "claude-3-5-sonnet-20241022",
                                max_tokens: request.max_tokens || (process.env.DEFAULT_MAX_TOKENS ? parseInt(process.env.DEFAULT_MAX_TOKENS) : 1000),
                                messages,
                                stream: true,
                            });
                            
                            for await (const followupChunk of followupStream) {
                                if (followupChunk.type === "content_block_delta" && followupChunk.delta.type === "text_delta") {
                                    yield {
                                        message: {
                                            role: 'assistant',
                                            content: followupChunk.delta.text
                                        }
                                    };
                                }
                            }
                        } catch (error: any) {
                            yield {
                                error: `Error processing tool call: ${error.message}`
                            };
                        }
                    }
                }
            } catch (error: any) {
                yield {
                    error: `Error processing chat stream: ${error.message}`
                };
            }
        })();
    }

    async listTools(request: ListToolsRequest = {}): Promise<ListToolsResponse> {
        /**
         * List available tools from the MCP server
         * 
         * @param request - Optional parameters for the request
         * @returns List of available tools
         */
        if (!this.isConnected) {
            return {
                tools: []
            };
        }

        try {
            const toolsResult = await this.mcp.listTools();
            const tools:any = toolsResult.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema
            }));
            
            return { tools };
        } catch (error: any) {
            console.error("Error listing tools:", error);
            return { tools: [] };
        }
    }

    async callTool(request: CallToolRequest): Promise<CallToolResponse> {
        /**
         * Call a tool on the MCP server
         * 
         * @param request - The tool call request
         * @returns The result of the tool call
         */
        if (!this.isConnected) {
            return {
                content: "",
                error: "Not connected to MCP server"
            };
        }

        try {
            // Parse arguments if they're provided as a string
            let args: any;
            if (typeof request.arguments === 'string') {
                try {
                    args = JSON.parse(request.arguments);
                } catch (e) {
                    args = request.arguments; // use as-is if not valid JSON
                }
            } else {
                args = request.arguments;
            }
            
            const result = await this.mcp.callTool({
                name: request.name,
                arguments: args,
            });
            
            return {
                content: result.content as string
            };
        } catch (error: any) {
            return {
                content: "",
                error: `Error calling tool: ${error.message}`
            };
        }
    }

    async cleanup(): Promise<void> {
        /**
         * Clean up resources
         */
        if (this.isConnected) {
            await this.mcp.close();
            this.isConnected = false;
        }
    }
}