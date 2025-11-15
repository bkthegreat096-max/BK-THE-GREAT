import React from 'react';
import { Message, Role } from '../types';
import { User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

export default ChatMessage;