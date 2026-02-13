import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { AiService } from '../services/aiService';
import { AIMessageContent } from './AIMessageContent';

interface AiChatWidgetProps {
  t: (key: any) => string;
  language: string;
  onOpenDemo?: (demoId: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ t, language, onOpenDemo, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Welcome Message when lang changes
  useEffect(() => {
     setMessages([{role: 'model', text: t('chatWelcome')}]);
  }, [language, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    // Add empty model message for streaming
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    let accumulatedText = '';

    try {
      await AiService.recommend(userMsg, undefined, (chunk) => {
        accumulatedText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = accumulatedText;
          }
          return [...newMessages]; // New array reference triggers re-render of this component ONLY
        });
      });
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'model' && lastMessage.text === '') {
          lastMessage.text = t('aiError') || 'Sorry, I encountered an error.';
        }
        return [...newMessages];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[500px] z-50"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm tracking-wide">{t('aiChatTitle')}</span>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.role === 'model' ? (
                      <AIMessageContent 
                        text={msg.text} 
                        onOpenDemo={onOpenDemo}
                        isStreaming={isLoading && i === messages.length - 1}
                      />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.text === '' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  placeholder={t('aiChatPlaceholder')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 transition-all flex items-center justify-center border border-slate-700"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-indigo-300" />}
        </button>
      </div>
    </>
  );
};
