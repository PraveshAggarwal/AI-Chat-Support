import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sources: {
    type: [String],
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Chat',
    maxlength: 100,
  },
  messages: {
    type: [messageSchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Auto-generate title from first user message
conversationSchema.methods.generateTitle = function () {
  const firstUserMsg = this.messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    const text = firstUserMsg.content.trim();
    this.title = text.length > 60 ? text.substring(0, 57) + '...' : text;
  }
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
