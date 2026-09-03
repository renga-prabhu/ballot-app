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
    messageCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now },
    topics: { type: [String], default: [] },
    requestType: { type: String, default: "general" },
    messages: { type: [MessageSchema], default: [] }
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, zip: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
