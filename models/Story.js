const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    title: String,
    genre: String,
    ageRating: String,
    coverResId: String,
    rawContent: String,
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);
