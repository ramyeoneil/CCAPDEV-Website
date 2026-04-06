require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword } = require('./utils/password');
const User = require('./model/User');
const Store = require('./model/Store');
const Product = require('./model/Product');
const Review = require('./model/Review');
const Post = require('./model/Post');

const mongoUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/techamuna';

async function run() {
  await mongoose.connect(mongoUrl);
  console.log('Connected to', mongoUrl);

  await Promise.all([User.deleteMany({}), Store.deleteMany({}), Product.deleteMany({}), Review.deleteMany({}), Post.deleteMany({})]);

  const [adminH, u1, u2, u3, u4, storeH] = await Promise.all([
    hashPassword('admin123'),
    hashPassword('user123'),
    hashPassword('user234'),
    hashPassword('user345'),
    hashPassword('user456'),
    hashPassword('store123')
  ]);

  const users = await User.create([
    { type: 'admin', email: 'admin@techamuna.com', password: adminH, username: 'TAM_Admin', dateJoined: '2025-01-01', status: 'approved' },
    { type: 'user', email: 'marga@example.com', password: u1, username: 'CtrlAltDefeat', address: 'Taft Ave', city: 'Manila', dateJoined: '2025-12-01', status: 'approved' },
    { type: 'user', email: 'user2@example.com', password: u2, username: 'MotherboardTheresa', city: 'Antipolo', dateJoined: '2025-12-05', status: 'approved' },
    { type: 'user', email: 'user3@example.com', password: u3, username: 'ByteMe', city: 'Mandaluyong', dateJoined: '2025-12-10', status: 'approved' },
    { type: 'user', email: 'user4@example.com', password: u4, username: 'builderPH', city: 'Pasig', dateJoined: '2025-12-12', status: 'approved' },
    { type: 'store', email: 'pchub@email.com', password: storeH, username: 'PC Hub', storeName: 'PC Hub', dateJoined: '2025-01-01', status: 'approved', phone: '', website: '' }
  ]);

  const stores = await Store.create([
    { name: 'PC Hub', email: 'pchub@email.com', location: 'Quezon City', city: 'Quezon City', province: 'Metro Manila', lat: 14.6156, lng: 121.0335, rating: 4.8, reviewCount: 127, status: 'approved', address: 'Gilmore Ave', phone: '+63 917 123 4567', website: 'https://pchub.com.ph', image: 'logo-green.svg', openTime: '09:00', closeTime: '19:00', days: 'Mon - Sat' },
    { name: 'DynaQuest PC', email: 'dynaquest@email.com', location: 'Manila', city: 'Manila', province: 'Metro Manila', lat: 14.5648, lng: 120.9932, rating: 4.4, reviewCount: 85, status: 'approved', address: 'Taft Ave', phone: '+63 917 555 0101', website: 'https://dynaquestpc.com', image: 'logo-green.svg', openTime: '09:00', closeTime: '19:00', days: 'Mon - Sat' },
    { name: 'EasyPC', email: 'easypc@email.com', location: 'Antipolo', city: 'Antipolo', province: 'Rizal', lat: 14.6215, lng: 121.1477, rating: 4.7, reviewCount: 64, status: 'approved', address: 'Circumferential Rd', phone: '+63 917 555 0202', website: 'https://easypc.com.ph', image: 'logo-green.svg', openTime: '10:00', closeTime: '18:00', days: 'Mon - Sat' },
    { name: 'Hardware Sugar', email: 'hwsugar@email.com', location: 'Makati', city: 'Makati', province: 'Metro Manila', lat: 14.5547, lng: 121.0144, rating: 4.9, reviewCount: 30, status: 'approved', address: 'Linear Makati', phone: '+63 917 555 0303', website: 'https://hardwaresugar.ph', image: 'logo-green.svg', openTime: '09:00', closeTime: '19:00', days: 'Mon - Sat' },
    { name: 'ByteShop', email: 'byte@email.com', location: 'Manila', city: 'Manila', province: 'Metro Manila', lat: 14.5995, lng: 120.9842, rating: 4.2, reviewCount: 30, status: 'approved', address: 'Espana Blvd', phone: '+63 917 555 0404', website: 'https://byteshop.example', image: 'logo-green.svg', openTime: '09:00', closeTime: '19:00', days: 'Mon - Sat' }
  ]);

  const products = await Product.create([
    { storeId: stores[0]._id, name: 'RTX 4090 Graphics Card', price: 89999, category: 'Graphics Card', description: 'Latest NVIDIA flagship GPU', stock: 5 },
    { storeId: stores[0]._id, name: 'Intel Core i9-14900K', price: 35999, category: 'CPU', description: 'High-performance processor', stock: 12 },
    { storeId: stores[1]._id, name: 'G.Skill Trident Z5 RGB 32GB', price: 8999, category: 'RAM', description: 'DDR5 6000MHz memory kit', stock: 20 },
    { storeId: stores[2]._id, name: 'ASUS ROG Motherboard', price: 18999, category: 'Motherboard', description: 'High-end board', stock: 7 },
    { storeId: stores[3]._id, name: 'Corsair 850W PSU', price: 6999, category: 'PSU', description: 'Reliable power supply', stock: 15 }
  ]);

  await Review.create([
    { storeId: stores[0]._id, storeName: stores[0].name, userId: users[1]._id, username: users[1].username, rating: 5, headline: 'Excellent service!', text: 'Fast shipping and genuine products. Gilmore trip was worth it.', date: '2026-02-15', upvotes: 12, comments: [], media: [], builderScores: { pricing: 5, customerService: 5, afterSales: 5 } },
    { storeId: stores[0]._id, storeName: stores[0].name, userId: users[2]._id, username: users[2].username, rating: 4, headline: 'Good prices', text: 'Competitive pricing and helpful staff.', date: '2026-02-10', upvotes: 5, comments: [], media: [], builderScores: { pricing: 4, customerService: 4, afterSales: 4 } },
    { storeId: stores[1]._id, storeName: stores[1].name, userId: users[3]._id, username: users[3].username, rating: 5, headline: 'Outstanding support', text: 'Very patient and helpful team.', date: '2026-02-05', upvotes: 8, comments: [], media: [], builderScores: { pricing: 4, customerService: 5, afterSales: 5 } },
    { storeId: stores[2]._id, storeName: stores[2].name, userId: users[4]._id, username: users[4].username, rating: 4, headline: 'Great staff', text: 'Answered all my questions regarding compatibility.', date: '2026-02-01', upvotes: 4, comments: [], media: [], builderScores: { pricing: 4, customerService: 4, afterSales: 4 } },
    { storeId: stores[3]._id, storeName: stores[3].name, userId: users[1]._id, username: users[1].username, rating: 5, headline: 'Fast delivery', text: 'Ordered on Monday, received on Wednesday.', date: '2026-01-15', upvotes: 6, comments: [], media: [], builderScores: { pricing: 5, customerService: 5, afterSales: 5 } }
  ]);

  await Post.create([
    { userId: users[1]._id, username: users[1].username, title: 'Just finished my build', content: 'Finally completed my dream build!', image: '', likes: 127, comments: [], date: '2026-02-15' },
    { userId: users[2]._id, username: users[2].username, title: 'PSA: Check your PSU', content: 'Make sure your PSU can handle new GPUs. Learned this the hard way.', image: '', likes: 89, comments: [], date: '2026-02-14' },
    { userId: users[3]._id, username: users[3].username, title: 'RGB setup', content: 'Synced with iCUE', image: '', likes: 156, comments: [], date: '2026-02-13' },
    { userId: users[4]._id, username: users[4].username, title: 'Where to buy in Taft?', content: 'Looking for best deals around the area.', image: '', likes: 12, comments: [], date: '2026-02-12' },
    { userId: users[1]._id, username: users[1].username, title: 'GPU tips', content: 'Cooling tips for high-end GPUs.', image: '', likes: 44, comments: [], date: '2026-02-11' }
  ]);

  console.log('Seed complete');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
