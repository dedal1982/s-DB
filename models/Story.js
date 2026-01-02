const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    genre: { type: String, required: true },
    ageRating: { type: String, required: true },
    coverResId: { type: Number, required: true },
    rawContent: { type: String, required: true },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);
