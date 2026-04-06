const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  title: String,
  content: String,
  image: String,
  likes: Number,
  comments: Array,
  date: String
});

module.exports = mongoose.model('Post', PostSchema);
