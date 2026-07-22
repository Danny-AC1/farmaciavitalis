import React from 'react';
import { SupportMessage, ReplyToPayload } from '../../services/db.support';
import { Product } from '../../types';
import { 
  CheckCheck, 
  ShoppingBag, 
  File as FileIcon, 
  CornerUpLeft, 
  Smile, 
  Trash2 
} from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import ChatImageAttachment from './ChatImageAttachment';

interface ChatMessageItemProps {
  msg: SupportMessage;
  isMe: boolean;
  currentUserRole: 'USER' | 'ADMIN';
  products?: Product[];
  emojis: string[];
  activeReactionMenu: string | null;
  onAddToCart?: (p: Product) => void;
  onReply: (payload: ReplyToPayload) => void;
  onToggleReactionMenu: (msgId: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onDelete: (msgId: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  isMe,
  currentUserRole,
  products = [],
  emojis,
  activeReactionMenu,
  onAddToCart,
  onReply,
  onToggleReactionMenu,
  onReact,
  onDelete,
}) => {
  const productMatch = msg.text.match(/^\[ATTACHMENT_PRODUCT:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);

  const formattedTime = msg.timestamp 
    ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative my-0.5`}>
      <div className="max-w-[88%] sm:max-w-[75%] relative">

        {productMatch ? (
          /* Premium parsed product recommendation card */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-2 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute right-0 top-0 bg-teal-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-bl-lg tracking-wider">
              Recomendado
            </div>
            <div className="flex gap-2.5 items-center">
              <img 
                src={productMatch[4]} 
                alt={productMatch[2]} 
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120';
                }}
              />
              <div className="min-w-0 flex-grow pr-10">
                <span className="text-[8px] font-black tracking-widest text-teal-600 uppercase block">Farmacia Vitalis</span>
                <h5 className="text-xs font-bold text-slate-800 truncate leading-tight mt-0.5">{productMatch[2]}</h5>
                <p className="text-xs font-mono font-black text-slate-900 mt-0.5">${parseFloat(productMatch[3]).toFixed(2)}</p>
              </div>
            </div>

            {onAddToCart && (
              <button
                onClick={() => {
                  const originalProduct = products.find(p => p.id === productMatch[1]);
                  const productToCart = originalProduct || {
                    id: productMatch[1],
                    name: productMatch[2],
                    price: parseFloat(productMatch[3]),
                    image: productMatch[4],
                    description: 'Recomendación del farmacéutico',
                    category: 'Recomendados',
                    stock: 99
                  };
                  onAddToCart(productToCart);
                }}
                className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ShoppingBag size={12} />
                <span>Añadir al Carrito</span>
              </button>
            )}

            <div className="flex justify-end items-center gap-1 select-none pt-0.5">
              <span className="text-[9px] text-slate-400 font-medium">
                {formattedTime}
              </span>
              {isMe && <CheckCheck size={11} className="text-teal-600" />}
            </div>
          </div>
        ) : (
          /* Standard WhatsApp / Telegram Style Chat Bubble */
          <div className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs sm:text-[13px] shadow-2xs relative ${
            isMe 
              ? 'bg-teal-600 text-white rounded-tr-xs' 
              : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
          }`}>
            
            {/* Reply Quoted Header inside the bubble */}
            {msg.replyToId && (
              <div className={`mb-1.5 p-1.5 px-2.5 rounded-lg border-l-2 text-[10px] leading-tight flex flex-col gap-0.5 ${
                isMe 
                  ? 'bg-teal-700/60 border-teal-200 text-teal-50'
                  : 'bg-slate-100 border-teal-500 text-slate-700'
              }`}>
                <span className={`font-bold text-[8px] uppercase tracking-wider ${isMe ? 'text-teal-200' : 'text-teal-600'}`}>
                  ⤺ {msg.replyToSenderName}
                </span>
                <span className="italic line-clamp-2 font-medium">"{msg.replyToText}"</span>
              </div>
            )}

            {/* Attachments */}
            {msg.mediaUrl && (
              <div className="mb-1.5 max-w-full overflow-hidden rounded-xl">
                {msg.mediaType === 'image' ? (
                  <ChatImageAttachment 
                    mediaUrl={msg.mediaUrl} 
                    senderRole={isMe ? currentUserRole : (currentUserRole === 'USER' ? 'ADMIN' : 'USER')} 
                  />
                ) : msg.mediaType === 'audio' ? (
                  <AudioPlayer src={msg.mediaUrl} isMe={isMe} />
                ) : (
                  <a 
                    href={msg.mediaUrl} 
                    download={msg.text ? msg.text.replace('[Archivo adjunto: ', '').replace(']', '') : 'adjunto'}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                      isMe 
                        ? 'bg-teal-700/55 hover:bg-teal-800 text-teal-50 border-teal-500/30' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    <FileIcon size={15} className={isMe ? 'text-teal-200' : 'text-teal-600'} />
                    <span className="truncate max-w-[180px] text-[10px] font-bold">Descargar Documento</span>
                  </a>
                )}
              </div>
            )}

            {/* Message Text with WhatsApp style floating time at bottom-right */}
            {msg.mediaType !== 'audio' && (
              <p className="whitespace-pre-wrap leading-snug break-words font-medium">
                {msg.text}
                <span className={`inline-flex items-center gap-0.5 float-right ml-2.5 mt-1 select-none text-[9.5px] font-semibold leading-none ${
                  isMe ? 'text-teal-100/90' : 'text-slate-400'
                }`}>
                  {formattedTime}
                  {isMe && <CheckCheck size={12} className="text-teal-200" />}
                </span>
              </p>
            )}

            {/* Audio only timestamp */}
            {msg.mediaType === 'audio' && (
              <div className="flex justify-end items-center gap-0.5 select-none mt-1">
                <span className={`text-[9.5px] font-semibold ${isMe ? 'text-teal-100/90' : 'text-slate-400'}`}>
                  {formattedTime}
                </span>
                {isMe && <CheckCheck size={12} className="text-teal-200" />}
              </div>
            )}

            {/* Reactions Display Panel */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(msg.id, emoji)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-2xs transition ${
                      isMe 
                        ? 'bg-teal-700/60 border-teal-500/30 text-white hover:bg-teal-800/80' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title={`Reaccionado por: ${users.join(', ')}`}
                  >
                    <span>{emoji}</span>
                    <span className="font-extrabold text-[8px]">{users.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hover action menus for replies, reactions, deletions */}
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-full px-1.5 py-0.5 z-20 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 ${
          isMe ? 'right-full mr-1.5' : 'left-full ml-1.5'
        }`}>
          {/* Reply icon */}
          <button
            type="button"
            onClick={() => onReply({
              id: msg.id,
              text: msg.text.startsWith('[ATTACHMENT_') ? 'Medicamento Recomendado' : msg.text,
              senderName: isMe ? 'Tú' : msg.senderName
            })}
            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-teal-600 rounded-full transition-colors"
            title="Responder / Citar"
          >
            <CornerUpLeft size={12} />
          </button>

          {/* Smile Reaction Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleReactionMenu(msg.id)}
              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-amber-500 rounded-full transition-colors"
              title="Reaccionar"
            >
              <Smile size={12} />
            </button>

            {/* Micro emoji reactions bar */}
            {activeReactionMenu === msg.id && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1.5 shadow-2xl z-30 animate-in zoom-in-90 duration-150">
                {emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => onReact(msg.id, e)}
                    className="hover:scale-125 transition-transform text-xs"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete message (Only if it's mine) */}
          {isMe && (
            <button
              type="button"
              onClick={() => onDelete(msg.id)}
              className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-full transition-colors"
              title="Eliminar mensaje"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatMessageItem;
