import { prisma } from '../index.js';

const conversationInclude = {
  participants: {
    include: { user: { include: { photos: true } } },
  },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
};

const formatConversation = (conversation, userId) => ({
  id: conversation.id,
  otherUser: conversation.participants.find((participant) => participant.userId !== userId)?.user,
  lastMessage: conversation.messages[0],
  createdAt: conversation.createdAt,
});

const userIsConversationParticipant = (conversationId, userId) => prisma.conversationParticipant.findFirst({
  where: { conversationId, userId },
  select: { id: true },
});

export const getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: req.userId },
      include: {
        conversation: { include: conversationInclude },
      },
    });

    const result = conversations.map((participant) => formatConversation(participant.conversation, req.userId));

    res.json({ conversations: result });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const startConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;

    if (req.userId === otherUserId) {
      return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
    }

    const match = await prisma.match.findFirst({
      where: {
        status: 'matched',
        OR: [
          { userOneId: req.userId, userTwoId: otherUserId },
          { userOneId: otherUserId, userTwoId: req.userId },
        ],
      },
    });

    if (!match) {
      return res.status(403).json({ error: 'You can only message mutual matches' });
    }

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: conversationInclude,
    });

    if (existingConversation) {
      return res.json({ conversation: formatConversation(existingConversation, req.userId) });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: req.userId }, { userId: otherUserId }],
        },
      },
      include: conversationInclude,
    });

    res.status(201).json({ conversation: formatConversation(conversation, req.userId) });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!await userIsConversationParticipant(conversationId, req.userId)) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { include: { photos: true } } },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit),
      skip,
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content required' });
    }

    if (!await userIsConversationParticipant(conversationId, req.userId)) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.userId,
        conversationId,
      },
      include: { sender: { include: { photos: true } } },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await prisma.message.updateMany({
      where: { conversationId, NOT: { senderId: req.userId } },
      data: { readAt: new Date() },
    });

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.message.delete({ where: { id: messageId } });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
