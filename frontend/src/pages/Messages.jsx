import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { useChatStore } from '../context/store';
import { chatService } from '../services';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Loading from '../components/Common/Loading';

const Messages = () => {
  const { conversations, currentConversation, messages, setConversations, setCurrentConversation, setMessages, addMessage } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
    }
  }, [currentConversation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await chatService.getConversations();
      setConversations(response.data.conversations || []);
      if (response.data.conversations?.length > 0) {
        setCurrentConversation(response.data.conversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    try {
      const response = await chatService.getMessages(currentConversation.id);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentConversation) return;

    const tempMessage = {
      id: Date.now(),
      content: messageText,
      createdAt: new Date().toISOString(),
      sender: { firstName: 'You' },
    };

    addMessage(tempMessage);
    setMessageText('');

    try {
      await chatService.sendMessage(currentConversation.id, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading && conversations.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Conversations Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col"
        >
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations yet</div>
            ) : (
              conversations.map((conversation) => (
                <motion.button
                  key={conversation.id}
                  onClick={() => setCurrentConversation(conversation)}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-4 text-left border-b transition-colors ${
                    currentConversation?.id === conversation.id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {conversation.otherUser.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>

        {/* Messages Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-1 flex-col"
        >
          {currentConversation ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentConversation.otherUser.firstName} {currentConversation.otherUser.lastName}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${msg.senderId === currentConversation.otherUser.id ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === currentConversation.otherUser.id
                            ? 'bg-gray-300 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" variant="primary">
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Messages;
