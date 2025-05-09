// src/services/MCPService.ts

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { EventEmitter } from 'events';

import { MCPClient } from './MCPClient';
import {
  ChatRequest,
  ChatResponse,
  ListToolsRequest,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
} from '../types';

const PROTO_PATH = path.resolve(__dirname, '../../proto/mcp.proto');

export class MCPService extends EventEmitter {
  private server = new grpc.Server();
  private mcpClient = new MCPClient();
  private isRunning = false;

  constructor(private serverScriptPath: string) {
    super();
  }

  /** 
   * 1) Connects the MCP client to your local server/process
   * 2) Boots up the gRPC server and binds all handlers
   */
  public async start(address = '0.0.0.0:50051'): Promise<void> {
    if (this.isRunning) return;

    // 1. spin up your MCPClient (Anthropic + stdio transport)
    await this.mcpClient.connectToServer(this.serverScriptPath);

    // 2. load the proto
    const pkgDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const grpcPkg = (grpc.loadPackageDefinition(pkgDef) as any).mcp;

    // 3. register your handlers, bound to this instance
    this.server.addService(grpcPkg.MCPService.service, {
      Chat:       this.handleChat.bind(this),
      ChatStream: this.handleChatStream.bind(this),
      ListTools:  this.handleListTools.bind(this),
      CallTool:   this.handleCallTool.bind(this),
    });

    // 4. listen
    await new Promise<void>((resolve, reject) => {
      this.server.bindAsync(
        address,
        grpc.ServerCredentials.createInsecure(),
        (err, _port) => {
          if (err) return reject(err);
          this.server.start();
          this.isRunning = true;
          console.log(`✅ gRPC MCPService listening on ${address}`);
          resolve();
        },
      );
    });
  }

  /** Gracefully stop the gRPC server and MCP client */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.server.tryShutdown(err => {
      if (err) console.error('❌ Error shutting down gRPC server:', err);
      else     console.log('🛑 gRPC server stopped');
    });
    await this.mcpClient.cleanup();
    this.isRunning = false;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────────────────

  /** unary Chat → delegates to MCPClient.chat(...) */
  private async handleChat(
    call: grpc.ServerUnaryCall<ChatRequest, ChatResponse>,
    callback: grpc.sendUnaryData<ChatResponse>
  ) {
    try {
      const resp = await this.mcpClient.chat(call.request);
      callback(null, resp);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message }, null!);
    }
  }

  /** server‐streaming ChatStream → delegates to MCPClient.chatStream(...) */
  private async handleChatStream(
    call: grpc.ServerWritableStream<ChatRequest, ChatResponse>
  ) {
    try {
      // 1. Await the promise to get the AsyncIterable
      const stream = await this.mcpClient.chatStream(call.request);
  
      // 2. Now you can use for-await properly
      for await (const chunk of stream) {
        call.write(chunk);
      }
  
      call.end();
    } catch (err: any) {
      call.destroy(err);
    }
  }
  

  /** unary ListTools → delegates to MCPClient.listTools(...) */
  private async handleListTools(
    call: grpc.ServerUnaryCall<ListToolsRequest, ListToolsResponse>,
    callback: grpc.sendUnaryData<ListToolsResponse>
  ) {
    try {
      const resp = await this.mcpClient.listTools(call.request);
      callback(null, resp);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message }, null!);
    }
  }

  /** unary CallTool → delegates to MCPClient.callTool(...) */
  private async handleCallTool(
    call: grpc.ServerUnaryCall<CallToolRequest, CallToolResponse>,
    callback: grpc.sendUnaryData<CallToolResponse>
  ) {
    try {
      const resp = await this.mcpClient.callTool(call.request);
      callback(null, resp);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message }, null!);
    }
  }
}
