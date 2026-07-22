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

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
      <div className="max-w-[85%] sm:max-w-[72%] space-y-1 relative">
        
        {/* Sender Display Name */}
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider px-1">
          {isMe ? 'Tú' : msg.senderName}
        </p>

        {/* Reply Quoted Header inside the bubble */}
        {msg.replyToId && (
          <div className={`mb-1 p-2 rounded-xl border text-[10px] leading-tight flex flex-col gap-0.5 ${
            isMe 
              ? (currentUserRole === 'USER' ? 'bg-teal-700/50 border-teal-500/20 text-teal-100' : 'bg-teal-800/80 border-teal-600 text-teal-50')
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <span className="font-black text-[8px] uppercase tracking-wider text-teal-300">
              ⤺ Respondido a {msg.replyToSenderName}
            </span>
            <span className="italic line-clamp-2 font-medium">"{msg.replyToText}"</span>
          </div>
        )}

        {productMatch ? (
          /* Premium parsed product recommendation card */
          <div className="bg-white rounded-3xl border border-slate-150 shadow-md p-4 space-y-3 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute right-0 top-0 bg-teal-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-wider">
              Recomendado
            </div>
            <div className="flex gap-3">
              <img 
                src={productMatch[4]} 
                alt={productMatch[2]} 
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120';
                }}
              />
              <div className="min-w-0 flex-grow pr-12">
                <span className="text-[8px] font-black tracking-widest text-teal-600 uppercase block">Farmacia Vitalis</span>
                <h5 className="text-xs font-extrabold text-slate-800 truncate leading-tight mt-0.5">{productMatch[2]}</h5>
                <p className="text-[11px] font-mono font-black text-slate-800 mt-1">${parseFloat(productMatch[3]).toFixed(2)}</p>
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
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/10"
              >
                <ShoppingBag size={12} />
                <span>Añadir al Carrito</span>
              </button>
            )}
          </div>
        ) : (
          /* Standard Chat Bubble */
          <div className={`px-5 py-3 rounded-2xl md:rounded-[1.5rem] text-xs font-semibold shadow-sm transition-all group-hover:shadow-md relative ${
            isMe 
              ? 'bg-teal-600 text-white rounded-tr-none' 
              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
          }`}>
            
            {/* Attachments */}
            {msg.mediaUrl && (
              <div className="mb-2 max-w-full overflow-hidden rounded-xl">
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
                    className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                      isMe 
                        ? 'bg-teal-700/55 hover:bg-teal-800 text-teal-50 border-teal-500/30' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    <FileIcon size={16} className={isMe ? 'text-teal-200' : 'text-teal-600'} />
                    <span className="truncate max-w-[180px] text-[10px] font-bold">Descargar Documento</span>
                  </a>
                )}
              </div>
            )}

            {/* Message Text */}
            {msg.mediaType !== 'audio' && (
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            )}

            {/* Reactions Display Panel */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(msg.id, emoji)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-xs transition ${
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

            {/* Time & Read Receipts */}
            <div className="flex justify-end items-center gap-1 mt-1 select-none">
              <span className={`text-[8px] ${isMe ? 'text-teal-200' : 'text-slate-400'} font-bold`}>
                {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
              {isMe && <CheckCheck size={11} className="text-teal-200" />}
            </div>
          </div>
        )}

        {/* Hover action menus for replies, reactions, deletions */}
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1 z-20 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 ${
          isMe ? 'right-full mr-2' : 'left-full ml-2'
        }`}>
          {/* Reply icon */}
          <button
            type="button"
            onClick={() => onReply({
              id: msg.id,
              text: msg.text.startsWith('[ATTACHMENT_') ? 'Medicamento Recomendado' : msg.text,
              senderName: isMe ? 'Tú' : msg.senderName
            })}
            className="p-1 hover:bg-slate-150 text-slate-500 hover:text-teal-600 rounded-full transition-colors"
            title="Responder / Citar"
          >
            <CornerUpLeft size={12} />
          </button>

          {/* Smile Reaction Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleReactionMenu(msg.id)}
              className="p-1 hover:bg-slate-150 text-slate-500 hover:text-amber-500 rounded-full transition-colors"
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
