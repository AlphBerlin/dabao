// src/services/MCPService.ts

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { EventEmitter } from 'events';
import {
  ChatRequest,
  ChatResponse,
  ListToolsRequest,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
  Tool,
} from '../types';

const PROTO_PATH = path.resolve(__dirname, '../../proto/mcp.proto');

// ─── In-memory tool registry ──────────────────────────────────────────────────
const tools: Tool[] = [
  { name: 'echo', description: 'Echoes back your input', input_schema: '{ "type":"string" }' },
  { name: 'time', description: 'Returns server time',   input_schema: '{}' },
];

// ─── Module-level gRPC handlers ────────────────────────────────────────────────
 async function chat(
  this: MCPService,
  call: grpc.ServerUnaryCall<ChatRequest, ChatResponse>,
  callback: grpc.sendUnaryData<ChatResponse>
) {
  const msgs = call.request.messages;
  const lastUser = msgs.slice().reverse().find(m => m.role === 'user');
  const userText = lastUser?.content ?? '';
  const reply = `Echoing your last message: "${userText}"`;

  callback(null, {
    message: { role: 'assistant', content: reply, metadata: {} },
    error: '',
  });
}

async function chatStream(
  this: MCPService,
  call: grpc.ServerWritableStream<ChatRequest, ChatResponse>
) {
  const msgs = call.request.messages;
  const userMsg = msgs[msgs.length - 1]?.content ?? '';
  const fullReply = `Here is a streamed reply to: "${userMsg}"`;
  let assembled = '';

  for (const word of fullReply.split(' ')) {
    assembled += (assembled ? ' ' : '') + word;
    call.write({
      message: { role: 'assistant', content: assembled, metadata: {} },
      error: '',
    });
    // you could also `await new Promise(r => setTimeout(r, 100));` for pacing
  }

  call.end();
}

function listTools(
  this: MCPService,
  call: grpc.ServerUnaryCall<ListToolsRequest, ListToolsResponse>,
  callback: grpc.sendUnaryData<ListToolsResponse>
) {
  callback(null, { tools });
}

function callTool(
  this: MCPService,
  call: grpc.ServerUnaryCall<CallToolRequest, CallToolResponse>,
  callback: grpc.sendUnaryData<CallToolResponse>
) {
  const { name, arguments: argsJson } = call.request;
  const tool = tools.find(t => t.name === name);

  if (!tool) {
    return callback(null, { content: '', error: `Tool "${name}" not found` });
  }

  try {
    const args = JSON.parse(argsJson);
    let result: any;

    switch (name) {
      case 'echo':
        result = { echoed: args };
        break;
      case 'time':
        result = { serverTime: new Date().toISOString() };
        break;
      default:
        result = { ok: true };
    }

    callback(null, { content: JSON.stringify(result), error: '' });
  } catch (err: any) {
    callback(null, { content: '', error: `Invalid args: ${err.message}` });
  }
}


// ─── The MCPService class ─────────────────────────────────────────────────────
export class MCPService extends EventEmitter {
  private server: grpc.Server;
  private isRunning = false;

  constructor() {
    super();
    this.server = new grpc.Server();
  }

  /**
   * Start the gRPC server and bind service methods.
   */
  public async start(address = 'localhost:50051'): Promise<void> {
    if (this.isRunning) return;

    console.log(`gRPC MCPService starting on ${address}`);

    // 1. Load proto
    const pkgDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const grpcPkg = (grpc.loadPackageDefinition(pkgDef) as any).mcp;

    // 2. Register handlers, bound to `this`
    this.server.addService(grpcPkg.MCPService.service, {
      Chat: chat.bind(this),
      ChatStream: chatStream.bind(this),
      ListTools: listTools.bind(this),
      CallTool:  callTool.bind(this),
    });

    // 3. Start listening
    await new Promise<void>((resolve, reject) => {
      this.server.bindAsync(
        address,
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (err) return reject(err);
          this.server.start();
          this.isRunning = true;
          console.log(`gRPC MCPService listening on ${address}`);
          resolve();
        }
      );
    });
  }

  /**
   * Gracefully stop the server.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.server.tryShutdown(err => {
      if (err) console.error('Error shutting down gRPC server:', err);
      else           console.log('gRPC server stopped');
    });
    this.isRunning = false;
  }
}
