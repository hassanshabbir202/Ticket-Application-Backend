const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: { // Changed from description to subtitle
    type: String,
    required: true,
  },
  issueDescription: { // Added new field for issue description
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attachedFiles: {
    type: [String], // Array of base64 encoded strings
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Ticket = mongoose.model("Ticket", TicketSchema);

module.exports = Ticket;
