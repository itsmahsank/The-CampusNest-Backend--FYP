const Chat = require('../models/chat.model');

// GET /api/chats/:roomId
const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({ roomId: req.params.roomId }).populate(
      'messages.senderId messages.receiverId',
      'name email'
    );

    if (!chat) {
      return res.status(404).json({ error: 'No messages found for this room' });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error('Error retrieving messages:', err);
    res.status(500).json({ error: 'Error retrieving messages' });
  }
};

// POST /api/chats/:roomId
const sendMessage = async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const { roomId } = req.params;

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ error: 'Missing senderId, receiverId or message' });
  }

  try {
    let chat = await Chat.findOne({ roomId });

    const newMessage = {
      senderId,
      receiverId,
      message,
      timestamp: new Date()
    };

    if (chat) {
      chat.messages.push(newMessage);
    } else {
      chat = new Chat({ roomId, messages: [newMessage] });
    }

    await chat.save();
    res.status(200).json({ message: 'Message saved successfully', chat });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getMessages,
  sendMessage
};
