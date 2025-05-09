import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace mcp. */
export namespace mcp {

    /** Represents a MCPService */
    class MCPService extends $protobuf.rpc.Service {

        /**
         * Constructs a new MCPService service.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         */
        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

        /**
         * Creates new MCPService service using the specified rpc implementation.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         * @returns RPC service. Useful where requests and/or responses are streamed.
         */
        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): MCPService;

        /**
         * Calls ChatStream.
         * @param request ChatRequest message or plain object
         * @param callback Node-style callback called with the error, if any, and ChatResponse
         */
        public chatStream(request: mcp.IChatRequest, callback: mcp.MCPService.ChatStreamCallback): void;

        /**
         * Calls ChatStream.
         * @param request ChatRequest message or plain object
         * @returns Promise
         */
        public chatStream(request: mcp.IChatRequest): Promise<mcp.ChatResponse>;
    }

    namespace MCPService {

        /**
         * Callback as used by {@link mcp.MCPService#chatStream}.
         * @param error Error, if any
         * @param [response] ChatResponse
         */
        type ChatStreamCallback = (error: (Error|null), response?: mcp.ChatResponse) => void;
    }

    /** Properties of a ChatMessage. */
    interface IChatMessage {

        /** ChatMessage role */
        role?: (string|null);

        /** ChatMessage content */
        content?: (string|null);

        /** ChatMessage metadata */
        metadata?: ({ [k: string]: string }|null);
    }

    /** Represents a ChatMessage. */
    class ChatMessage implements IChatMessage {

        /**
         * Constructs a new ChatMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: mcp.IChatMessage);

        /** ChatMessage role. */
        public role: string;

        /** ChatMessage content. */
        public content: string;

        /** ChatMessage metadata. */
        public metadata: { [k: string]: string };

        /**
         * Creates a new ChatMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChatMessage instance
         */
        public static create(properties?: mcp.IChatMessage): mcp.ChatMessage;

        /**
         * Encodes the specified ChatMessage message. Does not implicitly {@link mcp.ChatMessage.verify|verify} messages.
         * @param message ChatMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: mcp.IChatMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChatMessage message, length delimited. Does not implicitly {@link mcp.ChatMessage.verify|verify} messages.
         * @param message ChatMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: mcp.IChatMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mcp.ChatMessage;

        /**
         * Decodes a ChatMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mcp.ChatMessage;

        /**
         * Verifies a ChatMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChatMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChatMessage
         */
        public static fromObject(object: { [k: string]: any }): mcp.ChatMessage;

        /**
         * Creates a plain object from a ChatMessage message. Also converts values to other types if specified.
         * @param message ChatMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: mcp.ChatMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChatMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ChatMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ChatRequest. */
    interface IChatRequest {

        /** ChatRequest messages */
        messages?: (mcp.IChatMessage[]|null);

        /** ChatRequest model */
        model?: (string|null);

        /** ChatRequest temperature */
        temperature?: (number|null);

        /** ChatRequest maxTokens */
        maxTokens?: (number|null);

        /** ChatRequest clientId */
        clientId?: (string|null);

        /** ChatRequest sessionId */
        sessionId?: (string|null);

        /** ChatRequest parameters */
        parameters?: ({ [k: string]: string }|null);
    }

    /** Represents a ChatRequest. */
    class ChatRequest implements IChatRequest {

        /**
         * Constructs a new ChatRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: mcp.IChatRequest);

        /** ChatRequest messages. */
        public messages: mcp.IChatMessage[];

        /** ChatRequest model. */
        public model: string;

        /** ChatRequest temperature. */
        public temperature: number;

        /** ChatRequest maxTokens. */
        public maxTokens: number;

        /** ChatRequest clientId. */
        public clientId: string;

        /** ChatRequest sessionId. */
        public sessionId: string;

        /** ChatRequest parameters. */
        public parameters: { [k: string]: string };

        /**
         * Creates a new ChatRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChatRequest instance
         */
        public static create(properties?: mcp.IChatRequest): mcp.ChatRequest;

        /**
         * Encodes the specified ChatRequest message. Does not implicitly {@link mcp.ChatRequest.verify|verify} messages.
         * @param message ChatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: mcp.IChatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChatRequest message, length delimited. Does not implicitly {@link mcp.ChatRequest.verify|verify} messages.
         * @param message ChatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: mcp.IChatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mcp.ChatRequest;

        /**
         * Decodes a ChatRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mcp.ChatRequest;

        /**
         * Verifies a ChatRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChatRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChatRequest
         */
        public static fromObject(object: { [k: string]: any }): mcp.ChatRequest;

        /**
         * Creates a plain object from a ChatRequest message. Also converts values to other types if specified.
         * @param message ChatRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: mcp.ChatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChatRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ChatRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ChatResponse. */
    interface IChatResponse {

        /** ChatResponse message */
        message?: (mcp.IChatMessage|null);

        /** ChatResponse error */
        error?: (string|null);
    }

    /** Represents a ChatResponse. */
    class ChatResponse implements IChatResponse {

        /**
         * Constructs a new ChatResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: mcp.IChatResponse);

        /** ChatResponse message. */
        public message?: (mcp.IChatMessage|null);

        /** ChatResponse error. */
        public error: string;

        /**
         * Creates a new ChatResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChatResponse instance
         */
        public static create(properties?: mcp.IChatResponse): mcp.ChatResponse;

        /**
         * Encodes the specified ChatResponse message. Does not implicitly {@link mcp.ChatResponse.verify|verify} messages.
         * @param message ChatResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: mcp.IChatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChatResponse message, length delimited. Does not implicitly {@link mcp.ChatResponse.verify|verify} messages.
         * @param message ChatResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: mcp.IChatResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mcp.ChatResponse;

        /**
         * Decodes a ChatResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChatResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mcp.ChatResponse;

        /**
         * Verifies a ChatResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChatResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChatResponse
         */
        public static fromObject(object: { [k: string]: any }): mcp.ChatResponse;

        /**
         * Creates a plain object from a ChatResponse message. Also converts values to other types if specified.
         * @param message ChatResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: mcp.ChatResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChatResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ChatResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
