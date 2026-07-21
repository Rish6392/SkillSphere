import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations, fetchMessages, addMessage, setOnlineUsers, setTyping, setActiveConversationId } from '@/redux/slices/chatSlice';
import { getSocket, connectSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Send, Image, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { conversations, messages, onlineUsers, typingUsers } = useSelector((s) => s.chat);
  const [activeConvo, setActiveConvo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket(token);

    const handleNewMessage = (msg) => {
      dispatch(addMessage(msg));
      dispatch(fetchConversations()); // Refresh list to get new conversations/badges
    };
    const handleOnlineUsers = (users) => dispatch(setOnlineUsers(users));
    const handleUserTyping = ({ userId, conversationId }) => dispatch(setTyping({ conversationId, userId, isTyping: true }));
    const handleUserStopTyping = ({ userId, conversationId }) => dispatch(setTyping({ conversationId, userId, isTyping: false }));

    socket.on('new_message', handleNewMessage);
    socket.on('online_users', handleOnlineUsers);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle new chat request from URL parameters
  useEffect(() => {
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const gigId = searchParams.get('gigId');

    if (userId) {
      // Check if conversation already exists
      const existing = conversations.find(c => c.participants.some(p => p._id === userId));
      if (existing) {
        selectConversation(existing);
        setSearchParams({}); // clear params
      } else if (name) {
        // Create temporary conversation for UI
        setActiveConvo({
          isNew: true,
          _id: 'temp_' + userId,
          participants: [user, { _id: userId, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') }],
          gigId: gigId
        });
      }
    }
  }, [searchParams, conversations, user]);

  const selectConversation = (convo) => {
    setActiveConvo(convo);
    dispatch(setActiveConversationId(convo._id));
    dispatch(fetchMessages(convo._id));
    const socket = getSocket();
    if (socket) socket.emit('join_conversation', convo._id);
  };

  const getOtherUser = (convo) =>
    convo.participants?.find((p) => p._id !== user?._id);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    
    const other = getOtherUser(activeConvo);
    
    if (activeConvo.isNew) {
      // Use REST API for first message to create conversation in DB
      try {
        const res = await api.post('/messages/send', {
          receiverId: other._id,
          content: newMessage.trim(),
          gigId: activeConvo.gigId
        });
        
        const action = await dispatch(fetchConversations());
        if (action.payload && action.payload.conversations) {
          const newConvoId = res.data.data.conversationId;
          const newConvo = action.payload.conversations.find(c => c._id === newConvoId);
          if (newConvo) {
            selectConversation(newConvo);
          }
        }
        setSearchParams({});
        setNewMessage('');
      } catch (err) {
        console.error("Failed to send first message:", err);
        toast.error(err.response?.data?.message || "Failed to start conversation");
      }
    } else {
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', {
          conversationId: activeConvo._id,
          receiverId: other?._id,
          content: newMessage.trim(),
        });
        socket.emit('stop_typing', { conversationId: activeConvo._id });
      }
      setNewMessage('');
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket || !activeConvo) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversationId: activeConvo._id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { conversationId: activeConvo._id });
    }, 2000);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar — Conversation List */}
      <div className="w-80 border-r flex flex-col bg-white shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-6">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((convo) => {
              const other = getOtherUser(convo);
              const isOnline = onlineUsers.includes(other?._id);
              const isActive = activeConvo?._id === convo._id;
              return (
                <button
                  key={convo._id}
                  onClick={() => selectConversation(convo)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b cursor-pointer ${
                    isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={other?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {other?.firstName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {other?.firstName} {other?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {convo.lastMessage || 'Start chatting...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
          
          {/* Temporary Conversation (if new chat) */}
          {activeConvo?.isNew && (
            <button
              className="w-full flex items-center gap-3 p-4 text-left border-b cursor-pointer bg-primary/5 border-l-2 border-l-primary"
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getOtherUser(activeConvo)?.firstName?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getOtherUser(activeConvo)?.firstName} {getOtherUser(activeConvo)?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate italic">
                  New conversation
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose from your existing conversations to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getOtherUser(activeConvo)?.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">
                  {getOtherUser(activeConvo)?.firstName}{' '}
                  {getOtherUser(activeConvo)?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {onlineUsers.includes(getOtherUser(activeConvo)?._id) ? (
                    <span className="text-green-600">● Online</span>
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine =
                  msg.senderId?._id === user?._id ||
                  msg.senderId === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white border rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                      <div
                        className={`text-[10px] mt-1 ${
                          isMine ? 'text-white/60' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isMine && msg.isRead && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers[activeConvo._id] && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 bg-white border rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t bg-white flex items-center gap-2"
            >
              <Button type="button" variant="ghost" size="icon">
                <Image className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Input
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
