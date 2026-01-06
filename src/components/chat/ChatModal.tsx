import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ChatModalProps {
  bookingId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ 
  bookingId, 
  otherUserId, 
  otherUserName, 
  otherUserAvatar,
  isOpen, 
  onClose 
}: ChatModalProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatStartNotificationSent, setChatStartNotificationSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      markMessagesAsRead();
      
      // Envoyer une notification au professionnel quand le client démarre le chat
      if (!chatStartNotificationSent && profile?.user_type === 'client') {
        sendChatStartNotification();
        setChatStartNotificationSent(true);
      }

      // Subscribe to real-time messages
      const channel = supabase
        .channel(`chat-${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `booking_id=eq.${bookingId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
            
            // Mark as read if message is for current user
            if (payload.new.receiver_id === user?.id) {
              markMessageAsRead(payload.new.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, bookingId, user?.id]);

  const sendChatStartNotification = async () => {
    try {
      await supabase.functions.invoke('notification-system', {
        body: {
          userId: otherUserId,
          type: 'chat_started',
          title: 'Nouveau chat en direct',
          message: `${profile?.full_name || 'Un client'} a démarré un chat en direct avec vous`,
          bookingId: bookingId
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('booking_id', bookingId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Erreur lors du marquage des messages:', err);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          receiver_id: otherUserId,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full flex flex-col" style={{ height: '600px' }}>
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {otherUserAvatar ? (
              <img 
                src={otherUserAvatar} 
                alt={otherUserName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <i className="ri-user-line text-teal-600"></i>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
              <p className="text-xs text-gray-500">Chat en direct</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <i className="ri-loader-4-line animate-spin text-2xl text-teal-500"></i>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <i className="ri-chat-3-line text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">Aucun message</p>
              <p className="text-sm text-gray-400 mt-1">Commencez la conversation</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className={`flex items-center justify-end space-x-1 mt-1 ${
                        isOwn ? 'text-teal-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{formatTime(message.created_at)}</span>
                        {isOwn && (
                          <i className={`text-xs ${
                            message.is_read ? 'ri-check-double-line' : 'ri-check-line'
                          }`}></i>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Formulaire d'envoi */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                <i className="ri-send-plane-fill"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
