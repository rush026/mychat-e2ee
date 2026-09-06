import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { sendTypingStart, sendTypingStop } from '../../sockets/socketManager';

export default function MessageInput({ onSendMessage, conversationId, disabled }) {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input when conversation changes
    inputRef.current?.focus();
  }, [conversationId]);

  const handleChange = (e) => {
    setText(e.target.value);

    // Typing indicator logic
    sendTypingStart(conversationId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(conversationId);
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    const messageContent = text.trim();
    setText(''); // Optimistic clear

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTypingStop(conversationId);
    }

    await onSendMessage(messageContent);
  };

  return (
    <div className="p-4 bg-surface-900 border-t border-surface-700">
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-2 max-w-4xl mx-auto relative"
      >
        <div className="flex-1 glass-input rounded-2xl flex items-end overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 transition-all border border-surface-600">
          <button 
            type="button"
            className="p-3 text-slate-400 hover:text-primary-400 transition-colors shrink-0"
            disabled={disabled}
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            placeholder={disabled ? "Please wait..." : "Type an encrypted message..."}
            disabled={disabled}
            className="w-full max-h-32 min-h-[44px] py-3 px-2 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`
            p-3 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
            ${text.trim() && !disabled 
              ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow hover:scale-105' 
              : 'bg-surface-700 text-slate-500 cursor-not-allowed'}
          `}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
