import React, { useState, useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse, Modality, Part as GeminiPart } from "@google/genai";
import { Send, Paperclip, X, Image as ImageIcon, User, BrainCircuit, Sun, Zap, Paintbrush } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- TYPES ---
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Part {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export interface Message {
  role: Role;
  parts: Part[];
}


// --- GEMINI SERVICE ---
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateResponse = async (
  prompt: string,
  image: { base64: string; mimeType: string } | null
): Promise<Part[]> => {
  try {
    const model = 'gemini-2.5-flash-image'; // NANO BANANA
    const parts: GeminiPart[] = [];

    if (image) {
      parts.push(fileToGenerativePart(image.base64, image.mimeType));
    }
    
    if (prompt) {
      parts.push({ text: prompt });
    }

    if (parts.length === 0) {
      throw new Error("Prompt and image cannot both be empty.");
    }
    
    const imagePromptRegex = /\b(create|generate|draw|sketch|paint|render|make an image of|show me a picture of)\b/i;
    const expectsImage = !!image || imagePromptRegex.test(prompt);

    const config: { systemInstruction: string; responseModalities?: Modality[] } = {
      systemInstruction: "You are BK The Great, a powerful AI assistant created by a brilliant engineer. You must answer every question the user asks. Never mention that you are a language model or that you were trained by Google. You are the creation of BK The Great."
    };

    if (expectsImage) {
      config.responseModalities = [Modality.IMAGE];
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [{ parts }],
      config,
    });

    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts && responseParts.length > 0) {
      return responseParts as Part[];
    }
    
    if (response.text) {
      return [{ text: response.text }];
    }

    return [{ text: "I'm sorry, I couldn't generate a response. Please try again." }];

  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to get response from the AI model.");
  }
};


// --- COMPONENTS ---

// WelcomeScreen.tsx
interface WelcomeScreenProps {
  onExampleClick: (text: string, image: null) => void;
}

const examples = [
  {
    icon: <Sun size={24} />,
    text: "Explain quantum computing in simple terms",
  },
  {
    icon: <Zap size={24} />,
    text: "Got any creative ideas for a 10 year old’s birthday?",
  },
  {
    icon: <ImageIcon size={24} />,
    text: "What's in this image? (after uploading an image)",
  },
  {
    icon: <Paintbrush size={24} />,
    text: "Draw an astronaut riding a horse, in a photorealistic style",
  },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onExampleClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
      <div className="mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg mb-4">
          <BrainCircuit size={48} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-200">Hello, I'm BK The Great</h2>
        <p className="mt-2 text-lg">How can I help you today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(example.text, null)}
            className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/70 transition-colors text-left flex items-start space-x-4"
          >
            <div className="flex-shrink-0 text-indigo-400">{example.icon}</div>
            <p className="text-gray-300">{example.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ChatMessage.tsx
interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isModel = message.role === Role.MODEL;

  const Avatar = () => (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isModel ? 'bg-indigo-500' : 'bg-cyan-500'}`}>
      {isModel ? <span className="text-lg font-bold tracking-tighter">BK</span> : <User size={24} />}
    </div>
  );

  const LoadingIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
    </div>
  );

  const MessageContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    
    return message.parts.map((part, index) => {
      if (part.text) {
        return (
          // FIX: The `className` prop is not valid on `ReactMarkdown` and should be on a wrapper for Tailwind Typography.
          <div className="prose prose-invert prose-sm md:prose-base max-w-none">
            <ReactMarkdown
              key={index}
              components={{
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline" />,
                p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside" />,
                ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside" />,
                // FIX: The `inline` prop is deprecated and causes type errors.
                // Replaced with a check for newlines to distinguish block vs. inline code.
                code: ({node, children, ...props}) => 
                  String(children).includes('\n')
                    ? <code {...props} className="block bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">{children}</code>
                    : <code {...props} className="bg-gray-700 rounded-sm px-1 py-0.5 font-mono">{children}</code>,
              }}
            >
              {part.text}
            </ReactMarkdown>
          </div>
        );
      }
      if (part.inlineData) {
        return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="max-w-xs rounded-lg mt-2" alt={isModel ? "Generated image" : "User upload"} />;
      }
      return null;
    });
  };

  return (
    <div className={`flex items-start gap-4 ${isModel ? '' : 'justify-end'}`}>
      {isModel && <Avatar />}
      <div className={`max-w-2xl px-5 py-3 rounded-2xl ${isModel ? 'bg-gray-800 rounded-tl-none' : 'bg-cyan-600/50 rounded-tr-none'}`}>
        <MessageContent />
      </div>
      {!isModel && <Avatar />}
    </div>
  );
};

// ChatInput.tsx
interface ChatInputProps {
  onSendMessage: (text: string, image: { base64: string, mimeType: string } | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ file: File, preview: string, base64: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage({
          file: file,
          preview: URL.createObjectURL(file),
          base64: base64String,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if ((text.trim() || image) && !isLoading) {
      onSendMessage(text, image ? { base64: image.base64, mimeType: image.mimeType } : null);
      setText('');
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      textareaRef.current?.focus();
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
  }

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {image && (
        <div className="relative w-28 h-28 mb-2 p-2 bg-gray-800 rounded-lg">
          <img src={image.preview} alt="Image preview" className="w-full h-full object-cover rounded" />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 p-2 bg-gray-800 rounded-xl shadow-inner">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
          disabled={isLoading}
        >
          <Paperclip size={24} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          accept="image/*"
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          placeholder="Ask a question or describe an image to create..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none max-h-48"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !image)}
          className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
};


// App.tsx
const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = useCallback(async (text: string, image: { base64: string, mimeType: string } | null) => {
    if (!text && !image) return;

    const userParts: Part[] = [];
    if (text) userParts.push({ text });
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

    const userMessage: Message = {
      role: Role.USER,
      parts: userParts,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const modelParts = await generateResponse(text, image);
      const modelMessage: Message = {
        role: Role.MODEL,
        parts: modelParts,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: Role.MODEL,
        parts: [{ text: "I'm sorry, I encountered an error. Please try again." }],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white font-sans">
      <header className="flex items-center p-4 border-b border-gray-700/50 shadow-lg bg-gray-900/50 backdrop-blur-sm">
        <BrainCircuit className="h-8 w-8 text-indigo-400 mr-3" />
        <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">
          BK The Great
        </h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <WelcomeScreen onExampleClick={handleSendMessage}/>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))
        )}
        {isLoading && (
          <ChatMessage 
            message={{ role: Role.MODEL, parts: [] }} 
            isLoading={true} 
          />
        )}
        <div ref={messagesEndRef} />
      </main>
      
      <footer className="p-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        <p className="text-center text-xs text-gray-500 mt-2">Created by BK The Great</p>
      </footer>
    </div>
  );
};

// --- RENDER APP ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);