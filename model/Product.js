const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  storeId: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  category: String,
  description: String,
  stock: Number,
  image: String
});

module.exports = mongoose.model('Product', ProductSchema);
