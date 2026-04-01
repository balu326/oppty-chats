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
    required: function() {
      // Text is required only if there's no attachment
      return !this.attachment;
    }
  },
  attachment: {
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'link'],
      default: null
    },
    url: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    },
    mimeType: {
      type: String,
      default: null
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
