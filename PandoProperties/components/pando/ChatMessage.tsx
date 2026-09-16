'use client';

import React from 'react';
import { CheckCheck } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/property';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-1.5 sm:mb-2 animate-slide-up">
        <div className="max-w-[85%] bg-[#D92828] text-white rounded-2xl rounded-br-xs px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-2xs">
          <p className="text-[11px] sm:text-[12px] leading-snug font-normal">{message.text}</p>
          <div className="flex items-center justify-end space-x-1 mt-0.5 text-[8.5px] text-white/70 font-mono">
            <span>{message.timestamp}</span>
            <CheckCheck className="w-2.5 h-2.5 text-white/80 inline" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2 mb-1.5 sm:mb-2 animate-slide-up">
      {/* Pando AI Avatar */}
      <div className="w-6 h-6 rounded-full bg-[#FCECEE] border border-[#F9CFD4] flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden shadow-2xs">
        <img
          src="/images/pando/pando.png"
          alt="Pando"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
          className="w-full h-full object-cover"
        />
        <span className="text-[9px] font-bold text-[#D92828]">P</span>
      </div>

      {/* AI Message Bubble */}
      <div className="max-w-[88%] bg-white border border-[#E8E1D8] rounded-2xl rounded-tl-xs p-2.5 sm:p-3 shadow-2xs">
        <p className="text-[11px] sm:text-[11.5px] leading-snug text-[#222222] font-medium mb-1.5">
          {message.text}
        </p>

        {/* Status Indicators row */}
        {(message.syncedCount !== undefined || message.statusText) && (
          <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE4]">
            {message.syncedCount !== undefined && (
              <span className="bg-[#FDEBEC] border border-[#FAD0D4] text-[#D92828] text-[9.5px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                {message.syncedCount} HOMES SYNCED
              </span>
            )}

            {message.statusText && (
              <span className="text-[9.5px] font-bold text-[#2E9B73] flex items-center space-x-1 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B73]" />
                <span>{message.statusText}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
