import { verifyToken } from '../utils/jwt.js';

const getChatRoom = (conversationId) => `conversation:${conversationId}`;
const getUserRoom = (userId) => `user:${userId}`;
const activeCalls = new Map();

const hasActiveMatch = async (prisma, userId, otherUserId) => {
  const match = await prisma.match.findFirst({
    where: {
      status: 'matched',
      OR: [
        { userOneId: userId, userTwoId: otherUserId },
        { userOneId: otherUserId, userTwoId: userId },
      ],
    },
    select: { id: true },
  });
  return Boolean(match);
};

const getAuthorizedConversation = async (prisma, conversationId, userId) => {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
    include: {
      conversation: {
        select: {
          participants: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!participant) return null;

  const otherParticipant = participant.conversation.participants.find(
    (conversationParticipant) => conversationParticipant.userId !== userId
  );
  if (!otherParticipant || !await hasActiveMatch(prisma, userId, otherParticipant.userId)) {
    return null;
  }

  return participant;
};

export const registerChatSocket = (io, prisma) => {
  io.use(async (socket, next) => {
    const authorization = socket.handshake.headers.authorization;
    const token = socket.handshake.auth?.token ||
      (typeof authorization === 'string' ? authorization.replace(/^Bearer\s+/i, '') : null);
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || typeof decoded.userId !== 'string') {
      return next(new Error('Authentication required'));
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, firstName: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('Account is unavailable'));
      }

      socket.data.userId = user.id;
      socket.data.firstName = user.firstName;
      return next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Unable to authenticate socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(getUserRoom(userId));

    const getCallForParticipant = (callId) => {
      const call = activeCalls.get(callId);
      if (!call || (call.callerId !== userId && call.calleeId !== userId)) return null;
      return call;
    };

    const clearCall = (callId, event, payload) => {
      const call = activeCalls.get(callId);
      if (!call) return;
      if (call.timeout) clearTimeout(call.timeout);
      activeCalls.delete(callId);
      io.to(getUserRoom(call.callerId)).emit(event, payload);
      io.to(getUserRoom(call.calleeId)).emit(event, payload);
    };

    socket.on('call_user', async (payload, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const calleeId = typeof payload?.userId === 'string' ? payload.userId.trim() : '';

      if (!calleeId || calleeId === userId) {
        return respond({ error: 'A valid companion user ID is required' });
      }
      if ([...activeCalls.values()].some((call) =>
        call.callerId === userId || call.calleeId === userId
      )) {
        return respond({ error: 'You are already in a call' });
      }

      try {
        if (!await hasActiveMatch(prisma, userId, calleeId)) {
          return respond({ error: 'Calls are available only between active matches' });
        }

        const callee = await prisma.user.findUnique({
          where: { id: calleeId },
          select: { id: true, firstName: true, lastName: true, isActive: true },
        });
        if (!callee || !callee.isActive) {
          return respond({ error: 'This companion is unavailable' });
        }

        const callId = `${socket.id}:${Date.now()}`;
        const call = { callerId: userId, calleeId, accepted: false, timeout: null };
        activeCalls.set(callId, call);
        io.to(getUserRoom(calleeId)).emit('incoming_call', {
          callId,
          caller: { id: userId, firstName: socket.data.firstName || 'Companion' },
        });

        call.timeout = setTimeout(() => {
          clearCall(callId, 'call_ended', { callId, reason: 'timeout' });
        }, 30000);
        call.timeout.unref?.();

        return respond({ callId });
      } catch (error) {
        console.error('Start call error:', error);
        return respond({ error: 'Unable to start call' });
      }
    });

    socket.on('call_accept', (payload, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const call = getCallForParticipant(payload?.callId);
      if (!call || call.calleeId !== userId || call.accepted) {
        return respond({ error: 'This call is no longer available' });
      }

      call.accepted = true;
      if (call.timeout) clearTimeout(call.timeout);
      call.timeout = null;
      io.to(getUserRoom(call.callerId)).emit('call_accepted', { callId: payload.callId });
      return respond({ success: true });
    });

    socket.on('call_reject', (payload) => {
      const call = getCallForParticipant(payload?.callId);
      if (!call || call.calleeId !== userId) return;
      clearCall(payload.callId, 'call_rejected', { callId: payload.callId });
    });

    const relayCallSignal = (event, payload, field) => {
      const call = getCallForParticipant(payload?.callId);
      if (!call || !call.accepted || !payload?.[field]) return;
      const receiverId = call.callerId === userId ? call.calleeId : call.callerId;
      io.to(getUserRoom(receiverId)).emit(event, {
        callId: payload.callId,
        [field]: payload[field],
      });
    };

    socket.on('webrtc_offer', (payload) => {
      relayCallSignal('webrtc_offer', payload, 'description');
    });
    socket.on('webrtc_answer', (payload) => {
      relayCallSignal('webrtc_answer', payload, 'description');
    });
    socket.on('webrtc_ice_candidate', (payload) => {
      relayCallSignal('webrtc_ice_candidate', payload, 'candidate');
    });

    socket.on('call_end', (payload) => {
      const call = getCallForParticipant(payload?.callId);
      if (!call) return;
      clearCall(payload.callId, 'call_ended', { callId: payload.callId, userId });
    });

    socket.on('disconnect', () => {
      for (const [callId, call] of activeCalls.entries()) {
        if (call.callerId === userId || call.calleeId === userId) {
          clearCall(callId, 'call_ended', { callId, reason: 'disconnected' });
        }
      }
    });

    socket.on('join_room', async (payload, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const conversationId = typeof payload?.conversationId === 'string'
        ? payload.conversationId.trim()
        : '';

      if (!conversationId) {
        return respond({ error: 'Conversation ID is required' });
      }

      try {
        const participant = await getAuthorizedConversation(prisma, conversationId, socket.data.userId);
        if (!participant) {
          return respond({ error: 'You are not authorized to join this conversation' });
        }

        await socket.join(getChatRoom(conversationId));
        return respond({ success: true });
      } catch (error) {
        console.error('Join chat room error:', error);
        return respond({ error: 'Unable to join conversation' });
      }
    });

    socket.on('leave_room', (payload) => {
      const conversationId = typeof payload?.conversationId === 'string'
        ? payload.conversationId.trim()
        : '';
      if (conversationId) socket.leave(getChatRoom(conversationId));
    });

    socket.on('send_message', async (payload, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const conversationId = typeof payload?.conversationId === 'string'
        ? payload.conversationId.trim()
        : '';
      const content = typeof payload?.content === 'string' ? payload.content.trim() : '';

      if (!conversationId || !content || content.length > 2000) {
        return respond({ error: 'Conversation ID and a message of 1-2000 characters are required' });
      }

      try {
        const participant = await getAuthorizedConversation(prisma, conversationId, socket.data.userId);
        if (!participant || !socket.rooms.has(getChatRoom(conversationId))) {
          return respond({ error: 'You are not authorized to send messages in this conversation' });
        }

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.data.userId,
            content,
          },
          include: { sender: { include: { photos: true } } },
        });

        socket.to(getChatRoom(conversationId)).emit('receive_message', message);
        return respond({ message });
      } catch (error) {
        console.error('Socket send message error:', error);
        return respond({ error: 'Failed to send message' });
      }
    });
  });
};
