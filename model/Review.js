const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  storeId: mongoose.Schema.Types.ObjectId,
  storeName: String,
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  rating: Number,
  headline: String,
  text: String,
  date: String,
  upvotes: Number,
  comments: Array,
  media: Array,
  builderScores: Object
});

module.exports = mongoose.model('Review', ReviewSchema);
