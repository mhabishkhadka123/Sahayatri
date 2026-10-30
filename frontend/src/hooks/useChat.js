import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';
import { chatService } from '../services';

const SOCKET_URL = API_BASE_URL
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

const mergeMessages = (currentMessages, nextMessages) => {
  const messagesById = new Map(currentMessages.map((message) => [message.id, message]));
  nextMessages.forEach((message) => messagesById.set(message.id, message));
  return [...messagesById.values()].sort(
    (messageA, messageB) => new Date(messageA.createdAt) - new Date(messageB.createdAt)
  );
};

export const useChat = (conversationId) => {
  const socketRef = useRef(null);
  const isInRoomRef = useRef(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMessages([]);
    setError('');
    setIsConnected(false);
    setIsReady(false);
    isInRoomRef.current = false;
    if (!conversationId) return undefined;

    let isCurrentConversation = true;
    const token = localStorage.getItem('authToken');
    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReady(false);
      isInRoomRef.current = false;
      socket.emit('join_room', { conversationId }, (response) => {
        if (response?.error) {
          setError(response.error);
          return;
        }
        isInRoomRef.current = true;
        setError('');
        setIsReady(true);
      });
    });
    socket.on('disconnect', () => {
      isInRoomRef.current = false;
      setIsConnected(false);
      setIsReady(false);
    });
    socket.on('connect_error', (connectError) => {
      setIsConnected(false);
      setIsReady(false);
      setError(connectError.message || 'Unable to connect to chat');
    });
    socket.on('receive_message', (message) => {
      if (message.conversationId === conversationId) {
        setMessages((currentMessages) => mergeMessages(currentMessages, [message]));
      }
    });

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const response = await chatService.getMessages(conversationId);
        if (isCurrentConversation) {
          setMessages((currentMessages) =>
            mergeMessages(currentMessages, response.data.messages || [])
          );
        }
      } catch (historyError) {
        if (isCurrentConversation) {
          setError(historyError.response?.data?.error || 'Unable to load message history');
        }
      } finally {
        if (isCurrentConversation) setIsLoading(false);
      }
    };
    loadHistory();

    return () => {
      isCurrentConversation = false;
      socket.emit('leave_room', { conversationId });
      socket.disconnect();
      socketRef.current = null;
      isInRoomRef.current = false;
    };
  }, [conversationId]);

  const sendMessage = useCallback((content) => {
    const socket = socketRef.current;
    if (!conversationId || !socket?.connected || !isInRoomRef.current) {
      return Promise.reject(new Error('Chat is not ready to send messages'));
    }

    return new Promise((resolve, reject) => {
      socket.timeout(10000).emit('send_message', { conversationId, content }, (timeoutError, response) => {
        if (timeoutError) {
          reject(new Error('Message send timed out. Please try again.'));
          return;
        }
        if (response?.error) {
          setError(response.error);
          reject(new Error(response.error));
          return;
        }

        if (response?.message) {
          setMessages((currentMessages) =>
            mergeMessages(currentMessages, [response.message])
          );
          resolve(response.message);
          return;
        }

        reject(new Error('No message confirmation received'));
      });
    });
  }, [conversationId]);

  return { messages, isLoading, isConnected, isReady, error, sendMessage };
};
