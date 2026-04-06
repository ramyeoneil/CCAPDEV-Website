require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { hashPassword, verifyPassword } = require('./utils/password');
const app = express();

app.use(cors());
// Support DataURL images (profile/product) in JSON bodies
app.use(express.json({ limit: '20mb' }));

// Serve frontend static files from project root (Node.js must host the web app)
app.use(express.static(path.join(__dirname)));

const mongoUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/techamuna';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => console.error('MongoDB connection error', err));

// models
const User = require('./model/User');
const Store = require('./model/Store');
const Product = require('./model/Product');
const Review = require('./model/Review');
const Post = require('./model/Post');

function sanitizeUser(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete o.password;
  if (o._id) o.id = o._id;
  return o;
}

// Register a normal site user (buyer / community)
app.post('/api/users', async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password;
    const username = (body.username || '').trim();
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await hashPassword(password);
    const user = await User.create({
      type: 'user',
      email,
      password: hashed,
      username,
      address: body.address || '',
      city: body.city || '',
      province: body.province || '',
      postalCode: body.postalCode || '',
      dateJoined: new Date().toISOString().split('T')[0],
      builderIdentity: body.builderIdentity || 'Novice',
      profileImage: body.profileImage || 'https://via.placeholder.com/150',
      bio: body.bio || '',
      status: 'approved'
    });
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('POST /api/users error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Login (users and store owners)
app.post('/api/auth/login', async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password;
    if (!email || !password) return res.status(400).json({ error: 'missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.type === 'store' && user.status !== 'approved') {
      return res.status(403).json({ error: 'Your store application is pending approval' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('POST /api/auth/login error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Serve API to fetch all seed data (for frontend compatibility)
app.get('/api/data', async (req, res) => {
  try {
    const [users, stores, products, reviews, posts] = await Promise.all([
      User.find().select('-password').lean(),
      Store.find().lean(),
      Product.find().lean(),
      Review.find().lean(),
      Post.find().lean()
    ]);
    res.json({ users, stores, products, reviews, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Simple stores endpoint with optional q search
app.get('/api/stores', async (req, res) => {
  try {
    const q = req.query.q;
    let query = {};
    if (q) {
      const re = new RegExp(q, 'i');
      query = { name: re };
    }
    const stores = await Store.find(query).limit(Number(req.query.limit) || 20).lean();
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// convenience: get store by id
app.get('/api/stores/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).lean();
    if (!store) return res.status(404).json({ error: 'not found' });
    res.json(store);
  } catch (err) { res.status(500).json({ error: 'server error' }); }
});

// Admin action: update store status (e.g., approve/reject)
app.patch('/api/stores/:id/status', async (req, res) => {
  try {
    const status = String((req.body || {}).status || '').trim().toLowerCase();
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!store) return res.status(404).json({ error: 'store not found' });

    // Keep linked store account in sync by email/storeName if present.
    const userQuery = {
      type: 'store',
      $or: [
        { email: store.email || '' },
        { storeName: store.name || '' }
      ]
    };
    await User.updateMany(userQuery, { status });

    res.json({ store });
  } catch (err) {
    console.error('PATCH /api/stores/:id/status error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Create a new review
app.post('/api/reviews', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.storeId || !body.username || !body.rating) return res.status(400).json({ error: 'missing fields' });
    const review = await Review.create({
      storeId: body.storeId,
      storeName: body.storeName || '',
      userId: body.userId || null,
      username: body.username,
      rating: body.rating,
      headline: body.headline || '',
      text: body.text || '',
      date: new Date().toISOString().split('T')[0],
      upvotes: 0,
      comments: [],
      media: body.media || [],
      builderScores: body.builderScores || {}
    });

    // update store aggregate (best-effort)
    try {
      await Store.findByIdAndUpdate(body.storeId, { $inc: { reviewCount: 1 } });
    } catch(e){}

    res.status(201).json(review);
  } catch (err) {
    console.error('POST /api/reviews error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Edit a review (owner only in UI; backend does not enforce auth)
app.patch('/api/reviews/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    if (typeof body.rating === 'number') patch.rating = body.rating;
    if (typeof body.headline === 'string') patch.headline = body.headline;
    if (typeof body.text === 'string') patch.text = body.text;
    if (typeof body.builderScores === 'object') patch.builderScores = body.builderScores;
    const review = await Review.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!review) return res.status(404).json({ error: 'review not found' });
    res.json({ review });
  } catch (err) {
    console.error('PATCH /api/reviews/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Add a comment to a review
app.post('/api/reviews/:id/comments', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.userId || !body.username || !body.text) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const comment = {
      id: Date.now(),
      userId: body.userId,
      username: body.username,
      text: body.text,
      date: new Date().toISOString().split('T')[0]
    };
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    ).lean();
    if (!review) return res.status(404).json({ error: 'review not found' });
    res.status(201).json({ review });
  } catch (err) {
    console.error('POST /api/reviews/:id/comments error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Community posts
app.post('/api/posts', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.userId || !body.username || !body.content) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const post = await Post.create({
      userId: body.userId,
      username: body.username,
      title: body.title || '',
      content: body.content,
      image: body.image || '',
      likes: 0,
      comments: [],
      date: new Date().toISOString().split('T')[0]
    });
    res.status(201).json(post);
  } catch (err) {
    console.error('POST /api/posts error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Add a comment to a community post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.userId || !body.username || !body.text) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const comment = {
      id: Date.now(),
      userId: body.userId,
      username: body.username,
      text: body.text,
      date: new Date().toISOString().split('T')[0]
    };
    // Handle legacy posts where `comments` was stored as a number.
    const postDoc = await Post.findById(req.params.id);
    if (!postDoc) return res.status(404).json({ error: 'post not found' });
    if (!Array.isArray(postDoc.comments)) postDoc.comments = [];
    postDoc.comments.push(comment);
    await postDoc.save();
    const post = postDoc.toObject ? postDoc.toObject() : postDoc;
    res.status(201).json({ post });
  } catch (err) {
    console.error('POST /api/posts/:id/comments error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Store product management
app.post('/api/products', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.storeId || !body.name || Number.isNaN(Number(body.price))) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const product = await Product.create({
      storeId: body.storeId,
      name: body.name.trim(),
      price: Number(body.price),
      category: body.category || '',
      description: body.description || '',
      stock: Number.isNaN(Number(body.stock)) ? 0 : Number(body.stock),
      image: body.image || ''
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products error', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (body.price != null && !Number.isNaN(Number(body.price))) patch.price = Number(body.price);
    if (typeof body.category === 'string') patch.category = body.category;
    if (typeof body.description === 'string') patch.description = body.description;
    if (body.stock != null && !Number.isNaN(Number(body.stock))) patch.stock = Number(body.stock);
    if (typeof body.image === 'string') patch.image = body.image;
    const product = await Product.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!product) return res.status(404).json({ error: 'product not found' });
    res.json(product);
  } catch (err) {
    console.error('PATCH /api/products/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'product not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/products/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Apply/create store (store owner signup)
app.post('/api/stores', async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password;
    if (!body.storeName || !email) return res.status(400).json({ error: 'missing fields' });
    if (!password) return res.status(400).json({ error: 'password required' });

    const emailTaken = await User.findOne({ email });
    if (emailTaken) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await hashPassword(password);
    const user = await User.create({
      type: 'store',
      email,
      password: hashed,
      username: body.storeName.trim(),
      storeName: body.storeName.trim(),
      phone: body.phone || '',
      website: body.website || '',
      city: body.city || body.location || '',
      address: body.address || '',
      dateJoined: new Date().toISOString().split('T')[0],
      status: 'pending',
      profileImage: body.profileImage || 'https://via.placeholder.com/150'
    });

    const store = await Store.create({
      name: body.storeName.trim(),
      email,
      location: body.city || body.location || '',
      city: body.city || body.location || '',
      province: body.province || '',
      address: body.address || '',
      phone: body.phone || '',
      website: body.website || '',
      image: body.image || 'logo-green.svg',
      openTime: body.openTime || '',
      closeTime: body.closeTime || '',
      days: body.days || '',
      status: 'pending',
      dateApplied: new Date().toISOString().split('T')[0],
      reviewCount: 0,
      rating: 0
    });

    res.status(201).json({ store, user: sanitizeUser(user) });
  } catch (err) {
    console.error('POST /api/stores error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: edit store details
app.patch('/api/stores/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      website: body.website,
      address: body.address,
      location: body.location,
      city: body.city,
      province: body.province,
      openTime: body.openTime,
      closeTime: body.closeTime,
      days: body.days,
      status: body.status
    };
    Object.keys(patch).forEach(k => patch[k] == null && delete patch[k]);
    const store = await Store.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!store) return res.status(404).json({ error: 'store not found' });
    // keep store user in sync
    const uq = { type: 'store', $or: [{ email: store.email || '' }, { storeName: store.name || '' }] };
    await User.updateMany(uq, { status: store.status || 'pending', email: store.email || '', storeName: store.name || '', phone: store.phone || '' });
    res.json({ store });
  } catch (err) {
    console.error('PATCH /api/stores/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: delete store and store products/reviews
app.delete('/api/stores/:id', async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id).lean();
    if (!store) return res.status(404).json({ error: 'store not found' });
    await Promise.all([
      Product.deleteMany({ storeId: req.params.id }),
      Review.deleteMany({ storeId: req.params.id }),
      User.deleteMany({ type: 'store', $or: [{ email: store.email || '' }, { storeName: store.name || '' }] })
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/stores/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: edit user
app.patch('/api/users/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    if (typeof body.username === 'string') patch.username = body.username;
    if (typeof body.email === 'string') patch.email = body.email.trim().toLowerCase();
    if (typeof body.address === 'string') patch.address = body.address;
    if (typeof body.bio === 'string') patch.bio = body.bio;
    if (typeof body.profileImage === 'string') patch.profileImage = body.profileImage;
    const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true }).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ user });
  } catch (err) {
    console.error('PATCH /api/users/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'user not found' });
    await Review.deleteMany({ userId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/users/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: delete review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'review not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/reviews/:id error', err);
    res.status(500).json({ error: 'server error' });
  }
});

const port = process.env.PORT || 3000;
// Fallback to index.html for client-side routes (keep after API routes)
app.get('*', (req, res, next) => {
  // if request is for API, skip
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => console.log('Server listening on port', port));
