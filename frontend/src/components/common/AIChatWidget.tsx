import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  contextReportCount?: number;
  isLiveAnthropic?: boolean;
}

export const AIChatWidget: React.FC = () => {
  const { role, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'Manager'}! 👋\n\nI'm your **Executive AI Assistant** powered by Claude. I can analyze and answer questions about your engineering team's weekly reports, project workload, blockers, and deliverables.\n\nWhat would you like to know?`,
      modelUsed: 'claude-3-5-haiku',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Only render for Managers
  if (role !== 'MANAGER') {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.aiChat({
        message: text,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        modelUsed: res.modelUsed,
        contextReportCount: res.contextReportCount,
        isLiveAnthropic: res.isLiveAnthropic,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error retrieving response:** ${err.message || 'Unable to connect to AI assistant.'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat history cleared. How can I help you analyze your team reports?`,
      },
    ]);
  };

  // Helper to format basic markdown (bold, bullet points, headers)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-white text-xs mt-2 mb-1 border-b border-surface-700/60 pb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const bulletText = line.replace(/^[-*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs my-0.5 pl-1">
            <span className="text-primary-400 mt-1">•</span>
            <span
              dangerouslySetInnerHTML={{
                __html: bulletText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
              }}
            />
          </div>
        );
      }
      return (
        <p
          key={idx}
          className="text-xs leading-relaxed my-1"
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
          }}
        />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-primary-600 hover:from-purple-500 hover:to-primary-500 text-white font-bold rounded-full shadow-2xl shadow-purple-500/40 border border-purple-400/30 transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-surface-950 animate-pulse" />
          </div>
          <span className="text-xs tracking-tight flex items-center gap-1.5">
            Claude AI Assistant
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </span>
        </button>
      )}

      {/* Expandable Chat Drawer Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[540px] bg-surface-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-purple-950/80 via-surface-900 to-indigo-950/80 border-b border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">Claude AI Assistant</h3>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                    Manager
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-surface-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Connected to report context</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                title="Clear chat"
                className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-surface-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md'
                      : 'bg-surface-800/90 text-surface-200 border border-surface-700/70 shadow-sm'
                  }`}
                >
                  {renderFormattedContent(msg.content)}
                </div>

                {msg.role === 'assistant' && msg.contextReportCount && (
                  <div className="text-[9px] text-surface-500 font-mono mt-1 pl-1 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Analyzed {msg.contextReportCount} recent reports</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-surface-800/80 border border-surface-700/60 rounded-2xl max-w-[75%]">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse delay-150" />
                <span className="text-[11px] text-surface-400 ml-1">Analyzing reports...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-surface-950/60 border-t border-surface-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickPrompt('What did the design team work on last week?')}
              className="px-2.5 py-1 bg-surface-800/80 hover:bg-surface-700 border border-surface-700 rounded-lg text-[10px] text-surface-300 whitespace-nowrap transition-colors"
            >
              🎨 Design team last week?
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Are there any critical blockers currently open?')}
              className="px-2.5 py-1 bg-surface-800/80 hover:bg-surface-700 border border-surface-700 rounded-lg text-[10px] text-surface-300 whitespace-nowrap transition-colors"
            >
              🚨 Critical blockers?
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt("Summarize Alice Chen's recent deliverables")}
              className="px-2.5 py-1 bg-surface-800/80 hover:bg-surface-700 border border-surface-700 rounded-lg text-[10px] text-surface-300 whitespace-nowrap transition-colors"
            >
              👤 Alice Chen's progress
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-surface-950 border-t border-surface-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about team progress, blockers..."
              disabled={isLoading}
              className="flex-1 bg-surface-900 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-purple-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
