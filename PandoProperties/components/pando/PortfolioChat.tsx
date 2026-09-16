'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, ArrowRight, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/property';
import { ChatMessage } from './ChatMessage';
import { QuickSuggestion } from './QuickSuggestion';
import { PandoService } from '@/services/pandoService';

interface PortfolioChatProps {
  onRecalibrateFilter?: (filter: {
    location?: string;
    propertyType?: string;
    priceRange?: string;
  }) => void;
  onToast?: (message: string) => void;
  isExternalListening?: boolean;
  onVoiceListeningChange?: (listening: boolean) => void;
}

export const PortfolioChat: React.FC<PortfolioChatProps> = ({
  onRecalibrateFilter,
  onToast,
  isExternalListening = false,
  onVoiceListeningChange,
}) => {
  const [messages, setMessages] = useState<ChatMessageType[]>(() =>
    PandoService.getInitialMessages()
  );
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTypingResponse, setIsTypingResponse] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTypingResponse]);

  // Sync with external voice trigger if any
  useEffect(() => {
    if (isExternalListening && !isListening) {
      handleMicrophoneClick();
    }
  }, [isExternalListening]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // Current GST time format
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} GST`;

    const userMessage: ChatMessageType = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTypingResponse(true);

    // Process AI response simulation
    setTimeout(() => {
      const result = PandoService.processUserInput(text);

      const aiMessage: ChatMessageType = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'pando',
        text: result.reply,
        timestamp: timeStr,
        syncedCount: result.syncedCount,
        statusText: 'TRANSMITTED',
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTypingResponse(false);

      if (result.filterChange && onRecalibrateFilter) {
        onRecalibrateFilter(result.filterChange);
        onToast?.('Portfolio grid recalibrated by Pando');
      }
    }, 750);
  };

  const handleMicrophoneClick = () => {
    if (isListening) return;

    setIsListening(true);
    onVoiceListeningChange?.(true);
    onToast?.('Pando is listening to audio input...');

    setTimeout(() => {
      setIsListening(false);
      onVoiceListeningChange?.(false);
      // Auto populate voice query simulation
      handleSendMessage('Waterfront residences with private yacht berth');
    }, 2500);
  };

  const suggestions = [
    'Waterfront Only',
    'Palm Jumeirah',
    'Burj Skyline Views',
    'Under 35M AED',
  ];

  return (
    <div className="h-full flex-1 min-h-0 bg-[#FAF5EC] rounded-xl sm:rounded-2xl border border-[#E8E1D8] p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs overflow-hidden">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#EAE3D6] mb-1.5 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-[#D92828] text-white flex items-center justify-center font-bold text-[9px] shadow-2xs flex-shrink-0">
            AI
          </div>
          <div>
            <h3 className="text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#111111] leading-none">
              TAILORED RESIDENTIAL PORTFOLIO
            </h3>
            <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider font-semibold text-[#8C867E]">
              CYBERNETIC CONCIERGE • ACTIVE STREAM
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-white/90 border border-[#D5EADF] text-[#248259] text-[9px] sm:text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-2xs flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B73] animate-pulse" />
          <span className="tracking-wider uppercase">VOICE ACTIVE</span>
        </div>
      </div>

      {/* Messages Scroll Area - Scrollable internally without displaying scrollbars */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 mb-1.5 scroll-smooth scrollbar-none pb-2 space-y-2">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {isTypingResponse && (
          <div className="flex items-center space-x-1.5 text-[11px] text-[#8A847C] italic py-0.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D92828] animate-ping" />
            <span>Pando is calibrating residences...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips - horizontal non-wrapping with hidden scrollbar */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none flex-nowrap mb-1.5 sm:mb-2 flex-shrink-0 py-0.5">
        {suggestions.map((s) => (
          <QuickSuggestion
            key={s}
            label={s}
            onClick={(text) => handleSendMessage(text)}
            disabled={isTypingResponse}
          />
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center bg-white border border-[#E0D8CD] rounded-full pl-3 pr-1 py-1 shadow-2xs focus-within:border-[#BDB3A4] transition-all flex-shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isListening
              ? 'Listening to voice prompt...'
              : 'Input prompt or command Pando to refine...'
          }
          className="w-full text-xs text-[#111111] placeholder:text-[#948E85] bg-transparent focus:outline-none pr-1.5"
        />

        <div className="flex items-center space-x-1">
          {/* Microphone Simulation Button */}
          <button
            type="button"
            onClick={handleMicrophoneClick}
            aria-label="Voice input"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isListening
              ? 'bg-[#D92828] text-white animate-pulse'
              : 'text-[#66625C] hover:text-[#111111] hover:bg-[#F2ECE1]'
              }`}
            title="Voice Command"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() && !isListening}
            aria-label="Send prompt"
            className="w-7 h-7 rounded-full bg-[#D92828] hover:bg-[#C21E1E] disabled:opacity-40 disabled:hover:bg-[#D92828] text-white flex items-center justify-center transition-transform active:scale-95 shadow-2xs flex-shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
