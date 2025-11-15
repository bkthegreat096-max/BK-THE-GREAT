import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';

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
      // Auto-resize textarea
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

export default ChatInput;