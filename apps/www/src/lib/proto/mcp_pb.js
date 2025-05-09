/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const mcp = $root.mcp = (() => {

    /**
     * Namespace mcp.
     * @exports mcp
     * @namespace
     */
    const mcp = {};

    mcp.MCPService = (function() {

        /**
         * Constructs a new MCPService service.
         * @memberof mcp
         * @classdesc Represents a MCPService
         * @extends $protobuf.rpc.Service
         * @constructor
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         */
        function MCPService(rpcImpl, requestDelimited, responseDelimited) {
            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
        }

        (MCPService.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = MCPService;

        /**
         * Creates new MCPService service using the specified rpc implementation.
         * @function create
         * @memberof mcp.MCPService
         * @static
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         * @returns {MCPService} RPC service. Useful where requests and/or responses are streamed.
         */
        MCPService.create = function create(rpcImpl, requestDelimited, responseDelimited) {
            return new this(rpcImpl, requestDelimited, responseDelimited);
        };

        /**
         * Callback as used by {@link mcp.MCPService#chatStream}.
         * @memberof mcp.MCPService
         * @typedef ChatStreamCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {mcp.ChatResponse} [response] ChatResponse
         */

        /**
         * Calls ChatStream.
         * @function chatStream
         * @memberof mcp.MCPService
         * @instance
         * @param {mcp.IChatRequest} request ChatRequest message or plain object
         * @param {mcp.MCPService.ChatStreamCallback} callback Node-style callback called with the error, if any, and ChatResponse
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(MCPService.prototype.chatStream = function chatStream(request, callback) {
            return this.rpcCall(chatStream, $root.mcp.ChatRequest, $root.mcp.ChatResponse, request, callback);
        }, "name", { value: "ChatStream" });

        /**
         * Calls ChatStream.
         * @function chatStream
         * @memberof mcp.MCPService
         * @instance
         * @param {mcp.IChatRequest} request ChatRequest message or plain object
         * @returns {Promise<mcp.ChatResponse>} Promise
         * @variation 2
         */

        return MCPService;
    })();

    mcp.ChatMessage = (function() {

        /**
         * Properties of a ChatMessage.
         * @memberof mcp
         * @interface IChatMessage
         * @property {string|null} [role] ChatMessage role
         * @property {string|null} [content] ChatMessage content
         * @property {Object.<string,string>|null} [metadata] ChatMessage metadata
         */

        /**
         * Constructs a new ChatMessage.
         * @memberof mcp
         * @classdesc Represents a ChatMessage.
         * @implements IChatMessage
         * @constructor
         * @param {mcp.IChatMessage=} [properties] Properties to set
         */
        function ChatMessage(properties) {
            this.metadata = {};
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChatMessage role.
         * @member {string} role
         * @memberof mcp.ChatMessage
         * @instance
         */
        ChatMessage.prototype.role = "";

        /**
         * ChatMessage content.
         * @member {string} content
         * @memberof mcp.ChatMessage
         * @instance
         */
        ChatMessage.prototype.content = "";

        /**
         * ChatMessage metadata.
         * @member {Object.<string,string>} metadata
         * @memberof mcp.ChatMessage
         * @instance
         */
        ChatMessage.prototype.metadata = $util.emptyObject;

        /**
         * Creates a new ChatMessage instance using the specified properties.
         * @function create
         * @memberof mcp.ChatMessage
         * @static
         * @param {mcp.IChatMessage=} [properties] Properties to set
         * @returns {mcp.ChatMessage} ChatMessage instance
         */
        ChatMessage.create = function create(properties) {
            return new ChatMessage(properties);
        };

        /**
         * Encodes the specified ChatMessage message. Does not implicitly {@link mcp.ChatMessage.verify|verify} messages.
         * @function encode
         * @memberof mcp.ChatMessage
         * @static
         * @param {mcp.IChatMessage} message ChatMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.role != null && Object.hasOwnProperty.call(message, "role"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.role);
            if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.content);
            if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
                for (let keys = Object.keys(message.metadata), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 3, wireType 2 =*/26).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.metadata[keys[i]]).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ChatMessage message, length delimited. Does not implicitly {@link mcp.ChatMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mcp.ChatMessage
         * @static
         * @param {mcp.IChatMessage} message ChatMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChatMessage message from the specified reader or buffer.
         * @function decode
         * @memberof mcp.ChatMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mcp.ChatMessage} ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatMessage.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.mcp.ChatMessage(), key, value;
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.role = reader.string();
                        break;
                    }
                case 2: {
                        message.content = reader.string();
                        break;
                    }
                case 3: {
                        if (message.metadata === $util.emptyObject)
                            message.metadata = {};
                        let end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = "";
                        while (reader.pos < end2) {
                            let tag2 = reader.uint32();
                            switch (tag2 >>> 3) {
                            case 1:
                                key = reader.string();
                                break;
                            case 2:
                                value = reader.string();
                                break;
                            default:
                                reader.skipType(tag2 & 7);
                                break;
                            }
                        }
                        message.metadata[key] = value;
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChatMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mcp.ChatMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mcp.ChatMessage} ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChatMessage message.
         * @function verify
         * @memberof mcp.ChatMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChatMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.role != null && message.hasOwnProperty("role"))
                if (!$util.isString(message.role))
                    return "role: string expected";
            if (message.content != null && message.hasOwnProperty("content"))
                if (!$util.isString(message.content))
                    return "content: string expected";
            if (message.metadata != null && message.hasOwnProperty("metadata")) {
                if (!$util.isObject(message.metadata))
                    return "metadata: object expected";
                let key = Object.keys(message.metadata);
                for (let i = 0; i < key.length; ++i)
                    if (!$util.isString(message.metadata[key[i]]))
                        return "metadata: string{k:string} expected";
            }
            return null;
        };

        /**
         * Creates a ChatMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mcp.ChatMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mcp.ChatMessage} ChatMessage
         */
        ChatMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.mcp.ChatMessage)
                return object;
            let message = new $root.mcp.ChatMessage();
            if (object.role != null)
                message.role = String(object.role);
            if (object.content != null)
                message.content = String(object.content);
            if (object.metadata) {
                if (typeof object.metadata !== "object")
                    throw TypeError(".mcp.ChatMessage.metadata: object expected");
                message.metadata = {};
                for (let keys = Object.keys(object.metadata), i = 0; i < keys.length; ++i)
                    message.metadata[keys[i]] = String(object.metadata[keys[i]]);
            }
            return message;
        };

        /**
         * Creates a plain object from a ChatMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mcp.ChatMessage
         * @static
         * @param {mcp.ChatMessage} message ChatMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChatMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.objects || options.defaults)
                object.metadata = {};
            if (options.defaults) {
                object.role = "";
                object.content = "";
            }
            if (message.role != null && message.hasOwnProperty("role"))
                object.role = message.role;
            if (message.content != null && message.hasOwnProperty("content"))
                object.content = message.content;
            let keys2;
            if (message.metadata && (keys2 = Object.keys(message.metadata)).length) {
                object.metadata = {};
                for (let j = 0; j < keys2.length; ++j)
                    object.metadata[keys2[j]] = message.metadata[keys2[j]];
            }
            return object;
        };

        /**
         * Converts this ChatMessage to JSON.
         * @function toJSON
         * @memberof mcp.ChatMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChatMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ChatMessage
         * @function getTypeUrl
         * @memberof mcp.ChatMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChatMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/mcp.ChatMessage";
        };

        return ChatMessage;
    })();

    mcp.ChatRequest = (function() {

        /**
         * Properties of a ChatRequest.
         * @memberof mcp
         * @interface IChatRequest
         * @property {Array.<mcp.IChatMessage>|null} [messages] ChatRequest messages
         * @property {string|null} [model] ChatRequest model
         * @property {number|null} [temperature] ChatRequest temperature
         * @property {number|null} [maxTokens] ChatRequest maxTokens
         * @property {string|null} [clientId] ChatRequest clientId
         * @property {string|null} [sessionId] ChatRequest sessionId
         * @property {Object.<string,string>|null} [parameters] ChatRequest parameters
         */

        /**
         * Constructs a new ChatRequest.
         * @memberof mcp
         * @classdesc Represents a ChatRequest.
         * @implements IChatRequest
         * @constructor
         * @param {mcp.IChatRequest=} [properties] Properties to set
         */
        function ChatRequest(properties) {
            this.messages = [];
            this.parameters = {};
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChatRequest messages.
         * @member {Array.<mcp.IChatMessage>} messages
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.messages = $util.emptyArray;

        /**
         * ChatRequest model.
         * @member {string} model
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.model = "";

        /**
         * ChatRequest temperature.
         * @member {number} temperature
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.temperature = 0;

        /**
         * ChatRequest maxTokens.
         * @member {number} maxTokens
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.maxTokens = 0;

        /**
         * ChatRequest clientId.
         * @member {string} clientId
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.clientId = "";

        /**
         * ChatRequest sessionId.
         * @member {string} sessionId
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.sessionId = "";

        /**
         * ChatRequest parameters.
         * @member {Object.<string,string>} parameters
         * @memberof mcp.ChatRequest
         * @instance
         */
        ChatRequest.prototype.parameters = $util.emptyObject;

        /**
         * Creates a new ChatRequest instance using the specified properties.
         * @function create
         * @memberof mcp.ChatRequest
         * @static
         * @param {mcp.IChatRequest=} [properties] Properties to set
         * @returns {mcp.ChatRequest} ChatRequest instance
         */
        ChatRequest.create = function create(properties) {
            return new ChatRequest(properties);
        };

        /**
         * Encodes the specified ChatRequest message. Does not implicitly {@link mcp.ChatRequest.verify|verify} messages.
         * @function encode
         * @memberof mcp.ChatRequest
         * @static
         * @param {mcp.IChatRequest} message ChatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.messages != null && message.messages.length)
                for (let i = 0; i < message.messages.length; ++i)
                    $root.mcp.ChatMessage.encode(message.messages[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.model);
            if (message.temperature != null && Object.hasOwnProperty.call(message, "temperature"))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.temperature);
            if (message.maxTokens != null && Object.hasOwnProperty.call(message, "maxTokens"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.maxTokens);
            if (message.clientId != null && Object.hasOwnProperty.call(message, "clientId"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.clientId);
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.sessionId);
            if (message.parameters != null && Object.hasOwnProperty.call(message, "parameters"))
                for (let keys = Object.keys(message.parameters), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.parameters[keys[i]]).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ChatRequest message, length delimited. Does not implicitly {@link mcp.ChatRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mcp.ChatRequest
         * @static
         * @param {mcp.IChatRequest} message ChatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChatRequest message from the specified reader or buffer.
         * @function decode
         * @memberof mcp.ChatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mcp.ChatRequest} ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.mcp.ChatRequest(), key, value;
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.messages && message.messages.length))
                            message.messages = [];
                        message.messages.push($root.mcp.ChatMessage.decode(reader, reader.uint32()));
                        break;
                    }
                case 2: {
                        message.model = reader.string();
                        break;
                    }
                case 3: {
                        message.temperature = reader.double();
                        break;
                    }
                case 4: {
                        message.maxTokens = reader.int32();
                        break;
                    }
                case 5: {
                        message.clientId = reader.string();
                        break;
                    }
                case 6: {
                        message.sessionId = reader.string();
                        break;
                    }
                case 7: {
                        if (message.parameters === $util.emptyObject)
                            message.parameters = {};
                        let end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = "";
                        while (reader.pos < end2) {
                            let tag2 = reader.uint32();
                            switch (tag2 >>> 3) {
                            case 1:
                                key = reader.string();
                                break;
                            case 2:
                                value = reader.string();
                                break;
                            default:
                                reader.skipType(tag2 & 7);
                                break;
                            }
                        }
                        message.parameters[key] = value;
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChatRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mcp.ChatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mcp.ChatRequest} ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChatRequest message.
         * @function verify
         * @memberof mcp.ChatRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChatRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.messages != null && message.hasOwnProperty("messages")) {
                if (!Array.isArray(message.messages))
                    return "messages: array expected";
                for (let i = 0; i < message.messages.length; ++i) {
                    let error = $root.mcp.ChatMessage.verify(message.messages[i]);
                    if (error)
                        return "messages." + error;
                }
            }
            if (message.model != null && message.hasOwnProperty("model"))
                if (!$util.isString(message.model))
                    return "model: string expected";
            if (message.temperature != null && message.hasOwnProperty("temperature"))
                if (typeof message.temperature !== "number")
                    return "temperature: number expected";
            if (message.maxTokens != null && message.hasOwnProperty("maxTokens"))
                if (!$util.isInteger(message.maxTokens))
                    return "maxTokens: integer expected";
            if (message.clientId != null && message.hasOwnProperty("clientId"))
                if (!$util.isString(message.clientId))
                    return "clientId: string expected";
            if (message.sessionId != null && message.hasOwnProperty("sessionId"))
                if (!$util.isString(message.sessionId))
                    return "sessionId: string expected";
            if (message.parameters != null && message.hasOwnProperty("parameters")) {
                if (!$util.isObject(message.parameters))
                    return "parameters: object expected";
                let key = Object.keys(message.parameters);
                for (let i = 0; i < key.length; ++i)
                    if (!$util.isString(message.parameters[key[i]]))
                        return "parameters: string{k:string} expected";
            }
            return null;
        };

        /**
         * Creates a ChatRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mcp.ChatRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mcp.ChatRequest} ChatRequest
         */
        ChatRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.mcp.ChatRequest)
                return object;
            let message = new $root.mcp.ChatRequest();
            if (object.messages) {
                if (!Array.isArray(object.messages))
                    throw TypeError(".mcp.ChatRequest.messages: array expected");
                message.messages = [];
                for (let i = 0; i < object.messages.length; ++i) {
                    if (typeof object.messages[i] !== "object")
                        throw TypeError(".mcp.ChatRequest.messages: object expected");
                    message.messages[i] = $root.mcp.ChatMessage.fromObject(object.messages[i]);
                }
            }
            if (object.model != null)
                message.model = String(object.model);
            if (object.temperature != null)
                message.temperature = Number(object.temperature);
            if (object.maxTokens != null)
                message.maxTokens = object.maxTokens | 0;
            if (object.clientId != null)
                message.clientId = String(object.clientId);
            if (object.sessionId != null)
                message.sessionId = String(object.sessionId);
            if (object.parameters) {
                if (typeof object.parameters !== "object")
                    throw TypeError(".mcp.ChatRequest.parameters: object expected");
                message.parameters = {};
                for (let keys = Object.keys(object.parameters), i = 0; i < keys.length; ++i)
                    message.parameters[keys[i]] = String(object.parameters[keys[i]]);
            }
            return message;
        };

        /**
         * Creates a plain object from a ChatRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mcp.ChatRequest
         * @static
         * @param {mcp.ChatRequest} message ChatRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChatRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.messages = [];
            if (options.objects || options.defaults)
                object.parameters = {};
            if (options.defaults) {
                object.model = "";
                object.temperature = 0;
                object.maxTokens = 0;
                object.clientId = "";
                object.sessionId = "";
            }
            if (message.messages && message.messages.length) {
                object.messages = [];
                for (let j = 0; j < message.messages.length; ++j)
                    object.messages[j] = $root.mcp.ChatMessage.toObject(message.messages[j], options);
            }
            if (message.model != null && message.hasOwnProperty("model"))
                object.model = message.model;
            if (message.temperature != null && message.hasOwnProperty("temperature"))
                object.temperature = options.json && !isFinite(message.temperature) ? String(message.temperature) : message.temperature;
            if (message.maxTokens != null && message.hasOwnProperty("maxTokens"))
                object.maxTokens = message.maxTokens;
            if (message.clientId != null && message.hasOwnProperty("clientId"))
                object.clientId = message.clientId;
            if (message.sessionId != null && message.hasOwnProperty("sessionId"))
                object.sessionId = message.sessionId;
            let keys2;
            if (message.parameters && (keys2 = Object.keys(message.parameters)).length) {
                object.parameters = {};
                for (let j = 0; j < keys2.length; ++j)
                    object.parameters[keys2[j]] = message.parameters[keys2[j]];
            }
            return object;
        };

        /**
         * Converts this ChatRequest to JSON.
         * @function toJSON
         * @memberof mcp.ChatRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChatRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ChatRequest
         * @function getTypeUrl
         * @memberof mcp.ChatRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/mcp.ChatRequest";
        };

        return ChatRequest;
    })();

    mcp.ChatResponse = (function() {

        /**
         * Properties of a ChatResponse.
         * @memberof mcp
         * @interface IChatResponse
         * @property {mcp.IChatMessage|null} [message] ChatResponse message
         * @property {string|null} [error] ChatResponse error
         */

        /**
         * Constructs a new ChatResponse.
         * @memberof mcp
         * @classdesc Represents a ChatResponse.
         * @implements IChatResponse
         * @constructor
         * @param {mcp.IChatResponse=} [properties] Properties to set
         */
        function ChatResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChatResponse message.
         * @member {mcp.IChatMessage|null|undefined} message
         * @memberof mcp.ChatResponse
         * @instance
         */
        ChatResponse.prototype.message = null;

        /**
         * ChatResponse error.
         * @member {string} error
         * @memberof mcp.ChatResponse
         * @instance
         */
        ChatResponse.prototype.error = "";

        /**
         * Creates a new ChatResponse instance using the specified properties.
         * @function create
         * @memberof mcp.ChatResponse
         * @static
         * @param {mcp.IChatResponse=} [properties] Properties to set
         * @returns {mcp.ChatResponse} ChatResponse instance
         */
        ChatResponse.create = function create(properties) {
            return new ChatResponse(properties);
        };

        /**
         * Encodes the specified ChatResponse message. Does not implicitly {@link mcp.ChatResponse.verify|verify} messages.
         * @function encode
         * @memberof mcp.ChatResponse
         * @static
         * @param {mcp.IChatResponse} message ChatResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                $root.mcp.ChatMessage.encode(message.message, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.error);
            return writer;
        };

        /**
         * Encodes the specified ChatResponse message, length delimited. Does not implicitly {@link mcp.ChatResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof mcp.ChatResponse
         * @static
         * @param {mcp.IChatResponse} message ChatResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChatResponse message from the specified reader or buffer.
         * @function decode
         * @memberof mcp.ChatResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {mcp.ChatResponse} ChatResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.mcp.ChatResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.message = $root.mcp.ChatMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.error = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChatResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof mcp.ChatResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {mcp.ChatResponse} ChatResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChatResponse message.
         * @function verify
         * @memberof mcp.ChatResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChatResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.message != null && message.hasOwnProperty("message")) {
                let error = $root.mcp.ChatMessage.verify(message.message);
                if (error)
                    return "message." + error;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                if (!$util.isString(message.error))
                    return "error: string expected";
            return null;
        };

        /**
         * Creates a ChatResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof mcp.ChatResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {mcp.ChatResponse} ChatResponse
         */
        ChatResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.mcp.ChatResponse)
                return object;
            let message = new $root.mcp.ChatResponse();
            if (object.message != null) {
                if (typeof object.message !== "object")
                    throw TypeError(".mcp.ChatResponse.message: object expected");
                message.message = $root.mcp.ChatMessage.fromObject(object.message);
            }
            if (object.error != null)
                message.error = String(object.error);
            return message;
        };

        /**
         * Creates a plain object from a ChatResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof mcp.ChatResponse
         * @static
         * @param {mcp.ChatResponse} message ChatResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChatResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.message = null;
                object.error = "";
            }
            if (message.message != null && message.hasOwnProperty("message"))
                object.message = $root.mcp.ChatMessage.toObject(message.message, options);
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = message.error;
            return object;
        };

        /**
         * Converts this ChatResponse to JSON.
         * @function toJSON
         * @memberof mcp.ChatResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChatResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ChatResponse
         * @function getTypeUrl
         * @memberof mcp.ChatResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ChatResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/mcp.ChatResponse";
        };

        return ChatResponse;
    })();

    return mcp;
})();

export { $root as default };
