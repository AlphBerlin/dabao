# Image Generation API - Developer Quick Reference

## API Quick Reference

### Base URL
```
http://localhost:3000/api/images
```

### Available Endpoints
- `GET /providers` - List available providers
- `POST /generate` - Generate images
- `POST /stream` - Stream image generation process
- `GET /:filename` - Serve generated image

## Code Examples

### JavaScript/TypeScript

#### Basic Image Generation
```javascript
const generateImage = async (prompt) => {
  const response = await fetch('http://localhost:3000/api/images/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      provider: 'openai',
      size: '1024x1024',
    }),
  });
  
  const data = await response.json();
  return data;
};

// Usage
generateImage('A beautiful mountain landscape at sunset')
  .then(result => {
    console.log('Image URL:', result.images[0].url);
  });
```

#### Stream Image Updates with SSE
```javascript
const streamImageGeneration = (prompt) => {
  const eventSource = new EventSource('/api/images/stream', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      prompt,
      provider: 'stable-diffusion',
      numberOfImages: 2,
    }),
  });
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.status) {
      case 'starting':
      case 'preparing':
        console.log(data.message);
        break;
      case 'progress':
        console.log(`Image ${data.currentImage}/${data.totalImages} ready:`, data.image.url);
        break;
      case 'completed':
        console.log('All images ready:', data.images.map(img => img.url));
        eventSource.close();
        break;
      case 'error':
        console.error('Error:', data.error);
        eventSource.close();
        break;
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };
};
```

### React Example

```jsx
import { useState } from 'react';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const generateImage = async () => {
    if (!prompt) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider: 'openai',
          size: '1024x1024',
          quality: 'hd',
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setImages(data.images);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="image-generator">
      <h2>Generate an Image</h2>
      
      <div className="input-container">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
        />
        <button 
          onClick={generateImage}
          disabled={!prompt || loading}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      
      {error && (
        <div className="error">Error: {error}</div>
      )}
      
      <div className="images-grid">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img src={image.url} alt={prompt} />
            <div className="image-info">
              <div>Provider: {image.provider}</div>
              <div>Size: {image.size}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Integration with Chat Interface

To integrate image generation with a chat interface, allowing users to request images through conversation:

```jsx
import { useState } from 'react';

export function ChatWithImageGeneration() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Check if this is an image generation request
    if (input.toLowerCase().includes('generate an image') || 
        input.toLowerCase().includes('create an image')) {
      
      // Extract the prompt from the user message
      const promptRegex = /(?:generate|create) an image (?:of|showing|with|depicting) (.*)/i;
      const match = input.match(promptRegex);
      
      if (match && match[1]) {
        const imagePrompt = match[1];
        
        // Add system message about starting image generation
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Generating an image of: ${imagePrompt}...`
        }]);
        
        try {
          const response = await fetch('/api/images/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: imagePrompt,
              provider: 'openai',
              size: '1024x1024',
            }),
          });
          
          const data = await response.json();
          
          if (data.error) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Sorry, I couldn't generate that image. Error: ${data.error}`
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Here\'s the image you requested:',
              images: data.images
            }]);
          }
        } catch (err) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Sorry, there was an error generating the image: ${err.message}`
          }]);
        }
      }
    } else {
      // Handle regular chat message
      // ... your existing chat logic
    }
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            
            {msg.images && (
              <div className="message-images">
                {msg.images.map((image, imgIndex) => (
                  <img 
                    key={imgIndex}
                    src={image.url}
                    alt={`Generated image ${imgIndex + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message or ask for an image..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

## MCP Tool Integration

To use the image generation capability through Da Assistant's MCP (Model Context Protocol), use structured tool calls:

### Example Tool Call

```json
{
  "name": "generate_image",
  "arguments": {
    "prompt": "A scenic mountain vista with a lake reflecting the sunset",
    "style": "photographic",
    "size": "1024x1024",
    "numberOfImages": 1
  }
}
```

### Response Handling

The tool will return markdown formatted image links that can be displayed directly:

```
![Generated Image](/api/images/f7g8h9i0.png)
```