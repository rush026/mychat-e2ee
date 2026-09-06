import { format, isSameDay } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, isOwn, isDecrypted, isError }) {
  // If not yet decrypted and no error
  if (!isDecrypted && !isError) {
    return (
      <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`
          max-w-[70%] rounded-2xl px-4 py-2.5 
          ${isOwn ? 'msg-sent text-white' : 'msg-received text-slate-200'}
          animate-pulse-soft flex items-center gap-2
        `}>
          <span className="text-sm italic opacity-70">Decrypting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div className={`
        relative max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 
        ${isOwn ? 'msg-sent text-white shadow-glow' : 'msg-received text-slate-200'}
        ${isError ? 'border border-danger-500/50' : ''}
        transition-all duration-200
      `}>
        {/* Content */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {isError ? (
            <span className="text-danger-300 italic flex items-center gap-2">
              ⚠️ Could not decrypt message. Keys may have changed.
            </span>
          ) : (
            message._decryptedContent || '...'
          )}
        </p>

        {/* Meta (Time & Status) */}
        <div className={`
          flex items-center justify-end gap-1 mt-1 
          ${isOwn ? 'text-primary-200/70' : 'text-slate-400'}
        `}>
          <span className="text-[10px]">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          
          {isOwn && (
            <span className="ml-1">
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-info-300" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : message.status === 'sent' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-50" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
