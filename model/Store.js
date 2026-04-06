const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name: String,
  email: String,
  location: String,
  city: String,
  province: String,
  lat: Number,
  lng: Number,
  rating: Number,
  reviewCount: Number,
  status: String,
  address: String,
  image: String,
  phone: String,
  website: String,
  openTime: String,
  closeTime: String,
  days: String,
  dateApplied: String
});

module.exports = mongoose.model('Store', StoreSchema);
