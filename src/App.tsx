/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, RefreshCw, Lightbulb, TrendingUp, ShieldAlert, Link as LinkIcon, X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { ChatService, Message } from './services/geminiService';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatService, setChatService] = useState<ChatService | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const appUrl = process.env.APP_URL || window.location.origin;
  const directUrl = appUrl;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const initChat = async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API Key is missing.");
        setMessages([{ role: 'model', text: "I'm having trouble connecting to my brain (API Key missing). Please check your configuration." }]);
        return;
      }

      try {
        const service = new ChatService(apiKey);
        setChatService(service);
        
        setIsLoading(true);
        const text = await service.sendMessage("Hi! I'm an investor interested in your business. Please introduce yourself and tell me about your big idea.");
        setMessages([{ role: 'model', text }]);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setMessages([{ 
          role: 'model', 
          text: "I'm sorry, I'm having a hard time starting up right now. This usually happens if the connection is unstable or the service is temporarily busy." 
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, []);

  const handleRetry = () => {
    setMessages([]);
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const initChat = async () => {
        try {
          const service = new ChatService(apiKey);
          setChatService(service);
          setIsLoading(true);
          const text = await service.sendMessage("Hi! I'm an investor interested in your business. Please introduce yourself and tell me about your big idea.");
          setMessages([{ role: 'model', text }]);
        } catch (error) {
          console.error('Retry failed:', error);
          setMessages([{ role: 'model', text: "Still having trouble. Please try refreshing the entire page." }]);
        } finally {
          setIsLoading(false);
        }
      };
      initChat();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatService || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      let fullResponse = '';
      const stream = chatService.sendMessageStream(userMessage);
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullResponse };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I hit a bit of a snag. Could you try saying that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (window.confirm("Are you sure you want to start over? Your current progress will be lost.")) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const service = new ChatService(apiKey);
        setChatService(service);
        setMessages([]);
        setIsLoading(true);
        service.sendMessage("Hi! I'm an investor interested in your business. Please introduce yourself and tell me about your big idea.").then(text => {
          setMessages([{ role: 'model', text }]);
          setIsLoading(false);
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold leading-tight">Founder's Friend</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#5A5A40] font-semibold opacity-70">Student Investor Mentor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowEmbedModal(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors group"
              title="Share chatbot link"
            >
              <LinkIcon size={20} className="text-[#5A5A40]" />
            </button>
            <button 
              onClick={resetChat}
              className="p-2 hover:bg-black/5 rounded-full transition-colors group"
              title="Start New Session"
            >
              <RefreshCw size={20} className="text-[#5A5A40] group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Share Modal */}
      <AnimatePresence>
        {showEmbedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmbedModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">Share Chatbot</h2>
                <button 
                  onClick={() => setShowEmbedModal(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-black/60 mb-4">
                  Copy and share this direct link to the Founder's Friend chatbot.
                </p>
                <div className="relative">
                  <div className="bg-black/5 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-nowrap border border-black/5">
                    {directUrl}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-2 bg-white border border-black/10 rounded-lg shadow-sm hover:bg-black/5 transition-colors flex items-center gap-2 text-xs font-medium"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6 bg-black/5 text-center">
                <button 
                  onClick={() => setShowEmbedModal(false)}
                  className="px-6 py-2 bg-[#5A5A40] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-8 pr-2 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-[#1A1A1A] text-white' : 'bg-[#5A5A40] text-white'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-white border border-black/5 rounded-tr-none' 
                    : 'bg-[#5A5A40]/5 border border-[#5A5A40]/10 rounded-tl-none'
                }`}>
                  <div className="markdown-body text-[15px] leading-relaxed">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                  {msg.role === 'model' && messages.length === 1 && msg.text.includes("trouble") && (
                    <button 
                      onClick={handleRetry}
                      className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#5A5A40] hover:underline"
                    >
                      <RefreshCw size={14} />
                      Try again
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-[#5A5A40]/5 border border-[#5A5A40]/10 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Info Cards (Visible when no messages or as hints) */}
        {messages.length < 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
              <div className="text-[#5A5A40] mb-2"><Lightbulb size={20} /></div>
              <h3 className="font-serif font-semibold text-sm mb-1">The Problem</h3>
              <p className="text-xs text-black/60">What real-world pain point are you solving for people?</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
              <div className="text-[#5A5A40] mb-2"><TrendingUp size={20} /></div>
              <h3 className="font-serif font-semibold text-sm mb-1">The Market</h3>
              <p className="text-xs text-black/60">Who is your customer and why will they pay you?</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
              <div className="text-[#5A5A40] mb-2"><ShieldAlert size={20} /></div>
              <h3 className="font-serif font-semibold text-sm mb-1">The Edge</h3>
              <p className="text-xs text-black/60">What makes your solution better than what's out there?</p>
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="max-w-4xl w-full mx-auto px-6 pb-8 pt-4">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your idea or answer the question..."
            className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 pr-16 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all resize-none min-h-[60px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all ${
              input.trim() && !isLoading 
                ? 'bg-[#5A5A40] text-white shadow-md hover:scale-105 active:scale-95' 
                : 'bg-black/5 text-black/20 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-black/40 mt-4 uppercase tracking-widest font-medium">
          Refining ideas, one question at a time.
        </p>
      </footer>
    </div>
  );
}
