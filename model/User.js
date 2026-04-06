const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  type: String,
  email: { type: String, lowercase: true, trim: true },
  password: String,
  username: String,
  dateJoined: String,
  address: String,
  city: String,
  province: String,
  postalCode: String,
  profileImage: String,
  bio: String,
  builderIdentity: String,
  // store accounts: pending until admin approves
  status: { type: String, default: 'approved' },
  // store-specific fields
  storeName: String,
  phone: String,
  website: String
});

module.exports = mongoose.model('User', UserSchema);
