import React from 'react';
import { BrainCircuit, Sun, Zap, Image as ImageIcon, Paintbrush } from 'lucide-react';

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

export default WelcomeScreen;