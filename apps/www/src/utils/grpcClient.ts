import { MCPServiceClient } from '../proto/mcp_grpc_web_pb';
import { 
  ChatRequest, 
  ChatMessage,
  ListToolsRequest,
  CallToolRequest
} from '@/lib/proto/mcp_pb';
import { v4 as uuidv4 } from 'uuid';

// Create a unique client ID and session ID that persists during the session
const CLIENT_ID = typeof window !== 'undefined' ? localStorage.getItem('grpc_client_id') || uuidv4() : uuidv4();
if (typeof window !== 'undefined') {
  localStorage.setItem('grpc_client_id', CLIENT_ID);
}

// Create gRPC client instance
const client = new MCPServiceClient('http://your-grpc-server-address:port', null, null);

// Basic chat function
export const sendChatMessage = (messageContent, model = 'default-model', temperature = 0.7) => {
  return new Promise((resolve, reject) => {
    const request = new ChatRequest();
    const message = new ChatMessage();
    
    // Set message properties
    message.setRole('user');
    message.setContent(messageContent);
    
    // Add message to request
    request.addMessages(message);
    request.setModel(model);
    request.setTemperature(temperature);
    request.setClientId(CLIENT_ID);
    request.setSessionId(uuidv4()); // Create a new session ID for each conversation
    
    // Send the request
    client.chat(request, {}, (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (response.getError()) {
        reject(new Error(response.getError()));
        return;
      }
      
      resolve(response.getMessage().toObject());
    });
  });
};

// Stream chat function for incremental responses
export const streamChatMessage = (messageContent, onChunk, onError, onEnd, model = 'default-model', temperature = 0.7) => {
  const request = new ChatRequest();
  const message = new ChatMessage();
  
  // Set message properties
  message.setRole('user');
  message.setContent(messageContent);
  
  // Add message to request
  request.addMessages(message);
  request.setModel(model);
  request.setTemperature(temperature);
  request.setClientId(CLIENT_ID);
  request.setSessionId(uuidv4()); // Create a new session ID for each conversation
  
  // Start the stream
  const stream = client.chatStream(request, {});
  
  // Handle incoming data
  stream.on('data', (response) => {
    if (response.getError()) {
      onError(new Error(response.getError()));
      return;
    }
    
    onChunk(response.getMessage().toObject());
  });
  
  // Handle errors
  stream.on('error', (err) => {
    onError(err);
  });
  
  // Handle end of stream
  stream.on('end', () => {
    onEnd();
  });
  
  // Return the stream so it can be canceled if needed
  return stream;
};

// List available tools
export const listTools = () => {
  return new Promise((resolve, reject) => {
    const request = new ListToolsRequest();
    request.setClientId(CLIENT_ID);
    
    client.listTools(request, {}, (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(response.getToolsList().map(tool => tool.toObject()));
    });
  });
};

// Call a tool
export const callTool = (toolName, args) => {
  return new Promise((resolve, reject) => {
    const request = new CallToolRequest();
    request.setName(toolName);
    request.setArguments(JSON.stringify(args));
    request.setClientId(CLIENT_ID);
    request.setSessionId(uuidv4());
    
    client.callTool(request, {}, (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (response.getError()) {
        reject(new Error(response.getError()));
        return;
      }
      
      resolve(response.getContent());
    });
  });
};

