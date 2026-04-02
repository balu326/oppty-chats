import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  attachment: {
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'link'],
      default: undefined
    },
    url: {
      type: String,
      default: undefined
    },
    fileName: {
      type: String,
      default: undefined
    },
    fileSize: {
      type: Number,
      default: undefined
    },
    mimeType: {
      type: String,
      default: undefined
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for duplicate prevention
// Prevents same sender from sending same text within 1 second in same chat
messageSchema.index({ 
  chatId: 1, 
  sender: 1, 
  text: 1, 
  createdAt: 1 
}, { 
  unique: true,
  name: 'unique_message_per_chat_sender_text_time'
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
