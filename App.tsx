import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, Part } from './types';
import { generateResponse } from './services/geminiService';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import { BrainCircuit } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';

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

export default App;