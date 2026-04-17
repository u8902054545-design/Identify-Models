'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, GripVertical, Settings2, Trash2 } from 'lucide-react';
import { getBrandChatResponse, ChatMessage, ChatModelLevel, BrandIdentity } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function ChatWidget({ brandContext }: { brandContext: BrandIdentity | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "model",
    text: "Hi! I'm your AI Brand Consultant. Let me know if you need help refining your new brand identity, brainstorming campaigns, or tweaking the aesthetic."
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modelLevel, setModelLevel] = useState<ChatModelLevel>('general');
  const [showSettings, setShowSettings] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", text: input.trim() };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await getBrandChatResponse(
        messages.filter(m => m.role !== "model" || messages.indexOf(m) !== 0), // Pass all except the hardcoded first if needed, though Gemini can handle it
        userMessage.text,
        modelLevel,
        brandContext || undefined
      );

      setMessages([...newHistory, { role: "model", text: responseText }]);
    } catch (err) {
      console.error(err);
      setMessages([...newHistory, { role: "model", text: "**Error**: Unable to connect to the consultant. Please ensure your API key is configured correctly." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "model",
      text: "Chat cleared. What else can we discuss about your brand?"
    }]);
    setShowSettings(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-neutral-900 text-white p-4 rounded-full shadow-2xl hover:bg-neutral-800 transition-transform hover:scale-105 z-50 flex items-center justify-center group"
          aria-label="Open Brand Consultant Chat"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-full mr-4 bg-white text-neutral-900 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Brand Consultant
          </span>
        </button>
      )}

      {/* Chat Window */}
      <div 
        className={`fixed bottom-0 right-0 lg:bottom-6 lg:right-6 w-full lg:w-[420px] h-[80vh] lg:h-[600px] bg-white lg:rounded-2xl shadow-2xl flex flex-col border border-neutral-200 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        {/* Chat Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 lg:rounded-t-2xl flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-full">
               <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-sm">AI Brand Consultant</h3>
              <p className="text-xs text-white/60">
                {modelLevel === 'fast' ? 'Quick Reply' : modelLevel === 'complex' ? 'Deep Thinker' : 'Standard Consultant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-200 animate-in slide-in-from-top-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Consultant Mode (LLM Level)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setModelLevel('fast')}
                className={`py-2 text-xs font-medium rounded-md ${modelLevel === 'fast' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
              >
                Fast
              </button>
              <button
                onClick={() => setModelLevel('general')}
                className={`py-2 text-xs font-medium rounded-md ${modelLevel === 'general' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
              >
                Standard
              </button>
              <button
                onClick={() => setModelLevel('complex')}
                className={`py-2 text-xs font-medium rounded-md ${modelLevel === 'complex' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
              >
                Deep
              </button>
            </div>
            <button 
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear History
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6 bg-neutral-50/50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-neutral-200' : 'bg-neutral-900 text-white'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-neutral-600" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-800'} rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed`}>
                <div className="prose prose-sm prose-neutral prose-p:leading-relaxed max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                 <Bot className="w-4 h-4" />
               </div>
               <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-sm flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-neutral-200 pb-safe">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about brand strategy..."
              className="flex-grow bg-neutral-100 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-11 h-11 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
