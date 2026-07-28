import { prisma } from '../index.js';

export const getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: req.userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { include: { photos: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const result = conversations.map((cp) => ({
      id: cp.conversation.id,
      otherUser: cp.conversation.participants.find((p) => p.userId !== req.userId)?.user,
      lastMessage: cp.conversation.messages[0],
      createdAt: cp.conversation.createdAt,
    }));

    res.json({ conversations: result });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

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
