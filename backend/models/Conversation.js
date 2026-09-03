const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 2000 }
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    zip: { type: String, required: true },
    messages: { type: [MessageSchema], default: [] }
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, zip: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
