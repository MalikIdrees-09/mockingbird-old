import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import path from "path";
import { createNotification } from "./notifications.js";

const ensureTwoParticipantConversation = async (userA, userB) => {
  const participants = [userA, userB].sort();
  let convo = await Conversation.findOne({ participants });
  if (!convo) {
    convo = await Conversation.create({ participants });
  }
  return convo;
};

const areFriends = (user, otherUserId) => {
  return Array.isArray(user.friends) && user.friends.includes(otherUserId);
};

// listConversations implemented at end with friend enrichment

export const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: "recipientId required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!areFriends(user, recipientId)) {
      return res.status(403).json({ message: "Can only start conversations with friends" });
    }

    const convo = await ensureTwoParticipantConversation(userId, recipientId);
    return res.status(201).json(convo);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const listMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { limit = 30, before } = req.query;

    const convo = await Conversation.findById(conversationId).lean();
    if (!convo || !convo.participants.includes(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const query = { conversationId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json(messages.reverse());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, content = "" } = req.body;

    if (!recipientId) return res.status(400).json({ message: "recipientId required" });
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Message must include text or media" });
    }

    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });
    if (!areFriends(sender, recipientId)) {
      return res.status(403).json({ message: "Can only message friends" });
    }

    const convo = await ensureTwoParticipantConversation(senderId, recipientId);

    const media = [];
    const mediaTypes = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        media.push(path.posix.join("/assets", path.basename(f.path)));
        const type = f.mimetype.startsWith("image/")
          ? "image"
          : f.mimetype.startsWith("audio/")
          ? "audio"
          : f.mimetype.startsWith("video/") || f.mimetype === "video/webm"
          ? "video"
          : "file";
        mediaTypes.push(type);
      }
    }

    const message = await Message.create({
      conversationId: convo._id.toString(),
      senderId,
      recipientId,
      content,
      media,
      mediaTypes,
      deliveredAt: new Date(),
    });

    await Conversation.findByIdAndUpdate(convo._id, {
      lastMessageAt: new Date(),
      lastMessagePreview: content || (mediaTypes[0] ? `[${mediaTypes[0]}]` : ""),
      lastMessageSender: senderId,
    });

    // Create notification for recipient
    try {
      const notificationType = media.length > 0 ? 'message_media' : 'message';
      await createNotification(
        recipientId,
        senderId,
        notificationType,
        media.length > 0 ? `sent you ${media.length} file(s)` : 'sent you a message',
        convo._id.toString(),
        'user'
      );
    } catch (e) {
      // non-fatal
      console.error('Failed to create message notification:', e.message);
    }

    res.status(201).json(message);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    await Message.updateMany({ conversationId, recipientId: userId, readAt: null }, { $set: { readAt: new Date() } });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { content } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.senderId !== userId) return res.status(403).json({ message: "Cannot edit others' messages" });
    if (msg.isDeleted) return res.status(400).json({ message: "Cannot edit a deleted message" });
    msg.content = content || "";
    msg.isEdited = true;
    await msg.save();
    res.status(200).json(msg);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.senderId !== userId) return res.status(403).json({ message: "Cannot delete others' messages" });
    // Soft delete: keep record, remove content and media
    msg.isDeleted = true;
    msg.content = "";
    msg.media = [];
    msg.mediaTypes = [];
    await msg.save();
    const io = req.app.get("io");
    if (io) {
      io.emit("message_deleted", { conversationId: msg.conversationId, messageId });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const convos = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .lean();
    // Enrich with friend info
    const friendIds = Array.from(new Set(convos.flatMap(c => c.participants.filter(p => p !== userId))));
    const friends = await User.find({ _id: { $in: friendIds } }).select("_id firstName lastName picturePath location").lean();
    const friendMap = new Map(friends.map(f => [f._id.toString(), f]));
    const enriched = convos.map(c => {
      const otherId = c.participants.find(p => p !== userId);
      const f = friendMap.get((otherId || '').toString());
      return {
        ...c,
        friend: f ? { 
          id: f._id, 
          name: `${f.firstName || ''} ${f.lastName || ''}`.trim(), 
          picturePath: f.picturePath ? (f.picturePath.startsWith('/') ? f.picturePath : `/assets/${f.picturePath}`) : null, 
          location: f.location || '' 
        } : null,
      };
    });
    res.status(200).json(enriched);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


