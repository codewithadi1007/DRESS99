// ============================================
// 99DRESSES COMPLETE BACKEND SERVER
// Single-file backend with all features
// ============================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==========================================
// CONFIGURATION
// ==========================================

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only image files allowed!'));
    }
});

// ==========================================
// IN-MEMORY DATABASE
// ==========================================

let users = [
    {
        id: 1,
        username: 'fashionista_sarah',
        email: 'sarah@example.com',
        password: '$2a$10$XQZ.7vQ8yX6j3jVHKqBqUeF5fKYGzQ8XqZ7vQ8yX6j3jVHKqBqUe', // password123
        buttons: 250,
        avatar: null,
        createdAt: new Date('2025-01-01'),
        bio: 'Fashion lover & sustainable style advocate',
        followers: 145,
        following: 98
    }
];

let dresses = [
    {
        id: 1,
        sellerId: 1,
        brand: 'Reformation',
        title: 'Silk Midi Dress',
        description: 'Beautiful silk midi dress in perfect condition. Worn only twice.',
        category: 'Cocktail',
        size: 'M',
        condition: 'Like New',
        buttonsPrice: 85,
        originalPrice: 298,
        images: ['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg'],
        status: 'available',
        views: 234,
        likes: 42,
        createdAt: new Date('2025-01-15'),
        tags: ['silk', 'midi', 'cocktail']
    },
    {
        id: 2,
        sellerId: 1,
        brand: 'Zimmermann',
        title: 'Floral Maxi Dress',
        description: 'Stunning floral maxi dress, perfect for summer events.',
        category: 'Evening',
        size: 'S',
        condition: 'Excellent',
        buttonsPrice: 120,
        originalPrice: 550,
        images: ['https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg'],
        status: 'available',
        views: 189,
        likes: 56,
        createdAt: new Date('2025-01-20'),
        tags: ['floral', 'maxi', 'evening']
    },
    {
        id: 3,
        sellerId: 1,
        brand: 'Self Portrait',
        title: 'Lace Mini Dress',
        description: 'Intricate lace details, perfect for weddings.',
        category: 'Cocktail',
        size: 'S',
        condition: 'Good',
        buttonsPrice: 95,
        originalPrice: 350,
        images: ['https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg?auto=compress&cs=tinysrgb&w=400'],
        status: 'available',
        views: 120,
        likes: 30,
        createdAt: new Date(),
        tags: ['lace', 'mini']
    },
    {
        id: 4,
        sellerId: 1,
        brand: 'Ganni',
        title: 'Summer Wrap Dress',
        description: 'Lightweight and flowy, great for casual days.',
        category: 'Casual',
        size: 'L',
        condition: 'Like New',
        buttonsPrice: 55,
        originalPrice: 180,
        images: ['https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400'],
        status: 'available',
        views: 85,
        likes: 15,
        createdAt: new Date(),
        tags: ['summer', 'wrap']
    }
];

let transactions = [];
let messages = [];
let favorites = [];

let nextUserId = 2;
let nextDressId = 3;
let nextTransactionId = 1;
let nextMessageId = 1;

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: nextUserId++,
            username,
            email,
            password: hashedPassword,
            buttons: 100,
            avatar: null,
            createdAt: new Date(),
            bio: '',
            followers: 0,
            following: 0
        };

        users.push(newUser);

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                buttons: newUser.buttons
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                buttons: user.buttons,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        buttons: user.buttons,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt
    });
});

// ==========================================
// USER ROUTES
// ==========================================

// Get user profile
app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userDresses = dresses.filter(d => d.sellerId === user.id && d.status === 'available');

    res.json({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        buttons: user.buttons,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt,
        dressCount: userDresses.length
    });
});

// Update profile
app.put('/api/users/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { bio, username } = req.body;

    if (username && username !== user.username) {
        if (users.find(u => u.username === username && u.id !== user.id)) {
            return res.status(400).json({ error: 'Username taken' });
        }
        user.username = username;
    }

    if (bio !== undefined) user.bio = bio;

    res.json({
        message: 'Profile updated',
        user: {
            id: user.id,
            username: user.username,
            bio: user.bio,
            buttons: user.buttons
        }
    });
});

// ==========================================
// DRESS LISTING ROUTES
// ==========================================

// Get all dresses
app.get('/api/dresses', (req, res) => {
    const { category, minButtons, maxButtons, size, condition, search, sort } = req.query;

    let filteredDresses = dresses.filter(d => d.status === 'available');

    if (category) {
        filteredDresses = filteredDresses.filter(d => 
            d.category.toLowerCase() === category.toLowerCase()
        );
    }

    if (minButtons) {
        filteredDresses = filteredDresses.filter(d => d.buttonsPrice >= parseInt(minButtons));
    }

    if (maxButtons) {
        filteredDresses = filteredDresses.filter(d => d.buttonsPrice <= parseInt(maxButtons));
    }

    if (size) {
        filteredDresses = filteredDresses.filter(d => d.size.toLowerCase() === size.toLowerCase());
    }

    if (condition) {
        filteredDresses = filteredDresses.filter(d => 
            d.condition.toLowerCase() === condition.toLowerCase()
        );
    }

    if (search) {
        const searchLower = search.toLowerCase();
        filteredDresses = filteredDresses.filter(d => 
            d.title.toLowerCase().includes(searchLower) ||
            d.brand.toLowerCase().includes(searchLower) ||
            d.description.toLowerCase().includes(searchLower)
        );
    }

    // Sort
    if (sort === 'price-low') {
        filteredDresses.sort((a, b) => a.buttonsPrice - b.buttonsPrice);
    } else if (sort === 'price-high') {
        filteredDresses.sort((a, b) => b.buttonsPrice - a.buttonsPrice);
    } else if (sort === 'newest') {
        filteredDresses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'popular') {
        filteredDresses.sort((a, b) => b.likes - a.likes);
    }

    const dressesWithSeller = filteredDresses.map(dress => {
        const seller = users.find(u => u.id === dress.sellerId);
        return {
            ...dress,
            seller: {
                id: seller.id,
                username: seller.username,
                avatar: seller.avatar
            }
        };
    });

    res.json({
        total: dressesWithSeller.length,
        dresses: dressesWithSeller
    });
});

// Get single dress
app.get('/api/dresses/:id', (req, res) => {
    const dress = dresses.find(d => d.id === parseInt(req.params.id));
    if (!dress) return res.status(404).json({ error: 'Dress not found' });

    dress.views++;

    const seller = users.find(u => u.id === dress.sellerId);

    res.json({
        ...dress,
        seller: {
            id: seller.id,
            username: seller.username,
            avatar: seller.avatar,
            followers: seller.followers
        }
    });
});

// Create dress listing

// SIMPLIFIED UPLOAD ROUTE (No login required for testing)
app.post('/api/dresses', (req, res) => {
    // Receive JSON data
    const { brand, title, description, category, size, condition, buttonsPrice, images } = req.body;

    const newDress = {
        id: dresses.length + 5, // Generate simple ID
        sellerId: 1, // Default to first user
        brand, 
        title, 
        description: description || "Pre-loved item", 
        category: category || "Cocktail", 
        size: size || "M", 
        condition: condition || "Good",
        buttonsPrice: parseInt(buttonsPrice),
        originalPrice: 0,
        images: images || [],
        status: 'available',
        views: 0, 
        likes: 0,
        createdAt: new Date(),
        seller: { username: 'You', id: 1 } // Mock seller info
    };

    dresses.push(newDress); // Add to database
    res.json({ message: 'Dress listed successfully', dress: newDress });
});
    

// Update dress
app.put('/api/dresses/:id', authenticateToken, (req, res) => {
    const dress = dresses.find(d => d.id === parseInt(req.params.id));
    if (!dress) return res.status(404).json({ error: 'Dress not found' });

    if (dress.sellerId !== req.user.id) {
        return res.status(403).json({ error: 'Can only edit your own listings' });
    }

    const { brand, title, description, category, size, condition, buttonsPrice, originalPrice, status } = req.body;

    if (brand) dress.brand = brand;
    if (title) dress.title = title;
    if (description) dress.description = description;
    if (category) dress.category = category;
    if (size) dress.size = size;
    if (condition) dress.condition = condition;
    if (buttonsPrice) dress.buttonsPrice = parseInt(buttonsPrice);
    if (originalPrice) dress.originalPrice = parseInt(originalPrice);
    if (status) dress.status = status;

    res.json({
        message: 'Dress updated',
        dress
    });
});

// Delete dress
app.delete('/api/dresses/:id', authenticateToken, (req, res) => {
    const dressIndex = dresses.findIndex(d => d.id === parseInt(req.params.id));
    if (dressIndex === -1) return res.status(404).json({ error: 'Dress not found' });

    const dress = dresses[dressIndex];
    if (dress.sellerId !== req.user.id) {
        return res.status(403).json({ error: 'Can only delete your own listings' });
    }

    dresses.splice(dressIndex, 1);
    res.json({ message: 'Dress deleted' });
});

// Get user's own dresses
app.get('/api/users/me/dresses', authenticateToken, (req, res) => {
    const userDresses = dresses.filter(d => d.sellerId === req.user.id);
    res.json({ dresses: userDresses });
});

// ==========================================
// TRANSACTION ROUTES
// ==========================================

// Purchase dress
app.post('/api/transactions/purchase', authenticateToken, (req, res) => {
    try {
        const { dressId } = req.body;

        const dress = dresses.find(d => d.id === parseInt(dressId));
        if (!dress) return res.status(404).json({ error: 'Dress not found' });

        if (dress.status !== 'available') {
            return res.status(400).json({ error: 'Dress not available' });
        }

        const buyer = users.find(u => u.id === req.user.id);
        const seller = users.find(u => u.id === dress.sellerId);

        if (buyer.id === seller.id) {
            return res.status(400).json({ error: 'Cannot buy your own dress' });
        }

        if (buyer.buttons < dress.buttonsPrice) {
            return res.status(400).json({ 
                error: 'Insufficient buttons',
                required: dress.buttonsPrice,
                available: buyer.buttons
            });
        }

        buyer.buttons -= dress.buttonsPrice;
        seller.buttons += dress.buttonsPrice;
        dress.status = 'sold';

        const transaction = {
            id: nextTransactionId++,
            dressId: dress.id,
            buyerId: buyer.id,
            sellerId: seller.id,
            buttonsAmount: dress.buttonsPrice,
            status: 'completed',
            createdAt: new Date()
        };

        transactions.push(transaction);

        res.json({
            message: 'Purchase successful!',
            transaction,
            newButtonBalance: buyer.buttons
        });
    } catch (error) {
        res.status(500).json({ error: 'Purchase failed', details: error.message });
    }
});

// Get transaction history
app.get('/api/transactions/history', authenticateToken, (req, res) => {
    const userTransactions = transactions.filter(t => 
        t.buyerId === req.user.id || t.sellerId === req.user.id
    );

    const transactionsWithDetails = userTransactions.map(t => {
        const dress = dresses.find(d => d.id === t.dressId);
        const buyer = users.find(u => u.id === t.buyerId);
        const seller = users.find(u => u.id === t.sellerId);

        return {
            ...t,
            dress: dress ? {
                id: dress.id,
                title: dress.title,
                brand: dress.brand,
                images: dress.images
            } : null,
            buyer: { id: buyer.id, username: buyer.username },
            seller: { id: seller.id, username: seller.username },
            type: t.buyerId === req.user.id ? 'purchase' : 'sale'
        };
    });

    res.json({ transactions: transactionsWithDetails });
});

// ==========================================
// FAVORITES ROUTES
// ==========================================

// Add to favorites
app.post('/api/favorites/:dressId', authenticateToken, (req, res) => {
    const dressId = parseInt(req.params.dressId);
    const dress = dresses.find(d => d.id === dressId);

    if (!dress) return res.status(404).json({ error: 'Dress not found' });

    const existingFavorite = favorites.find(f => 
        f.userId === req.user.id && f.dressId === dressId
    );

    if (existingFavorite) {
        return res.status(400).json({ error: 'Already in favorites' });
    }

    favorites.push({
        userId: req.user.id,
        dressId: dressId,
        createdAt: new Date()
    });

    dress.likes++;
    res.json({ message: 'Added to favorites' });
});

// Remove from favorites
app.delete('/api/favorites/:dressId', authenticateToken, (req, res) => {
    const dressId = parseInt(req.params.dressId);
    const favoriteIndex = favorites.findIndex(f => 
        f.userId === req.user.id && f.dressId === dressId
    );

    if (favoriteIndex === -1) {
        return res.status(404).json({ error: 'Not in favorites' });
    }

    favorites.splice(favoriteIndex, 1);

    const dress = dresses.find(d => d.id === dressId);
    if (dress && dress.likes > 0) dress.likes--;

    res.json({ message: 'Removed from favorites' });
});

// Get favorites
app.get('/api/favorites', authenticateToken, (req, res) => {
    const userFavorites = favorites.filter(f => f.userId === req.user.id);
    
    const favoriteDresses = userFavorites.map(f => {
        const dress = dresses.find(d => d.id === f.dressId);
        if (!dress) return null;

        const seller = users.find(u => u.id === dress.sellerId);
        return {
            ...dress,
            seller: {
                id: seller.id,
                username: seller.username,
                avatar: seller.avatar
            }
        };
    }).filter(d => d !== null);

    res.json({ favorites: favoriteDresses });
});

// ==========================================
// MESSAGING ROUTES
// ==========================================

// Send message
app.post('/api/messages', authenticateToken, (req, res) => {
    const { recipientId, content, dressId } = req.body;

    if (!recipientId || !content) {
        return res.status(400).json({ error: 'Recipient and content required' });
    }

    const recipient = users.find(u => u.id === parseInt(recipientId));
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const message = {
        id: nextMessageId++,
        senderId: req.user.id,
        recipientId: parseInt(recipientId),
        content,
        dressId: dressId ? parseInt(dressId) : null,
        read: false,
        createdAt: new Date()
    };

    messages.push(message);
    res.status(201).json({ message: 'Message sent', data: message });
});

// Get conversations
app.get('/api/messages/conversations', authenticateToken, (req, res) => {
    const userMessages = messages.filter(m => 
        m.senderId === req.user.id || m.recipientId === req.user.id
    );

    const conversations = {};
    userMessages.forEach(msg => {
        const partnerId = msg.senderId === req.user.id ? msg.recipientId : msg.senderId;
        
        if (!conversations[partnerId]) {
            const partner = users.find(u => u.id === partnerId);
            conversations[partnerId] = {
                user: {
                    id: partner.id,
                    username: partner.username,
                    avatar: partner.avatar
                },
                lastMessage: msg,
                unreadCount: 0
            };
        }

        if (msg.createdAt > conversations[partnerId].lastMessage.createdAt) {
            conversations[partnerId].lastMessage = msg;
        }

        if (!msg.read && msg.recipientId === req.user.id) {
            conversations[partnerId].unreadCount++;
        }
    });

    res.json({ conversations: Object.values(conversations) });
});

// Get messages with specific user
app.get('/api/messages/:userId', authenticateToken, (req, res) => {
    const otherUserId = parseInt(req.params.userId);
    
    const conversation = messages.filter(m => 
        (m.senderId === req.user.id && m.recipientId === otherUserId) ||
        (m.senderId === otherUserId && m.recipientId === req.user.id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    conversation.forEach(msg => {
        if (msg.recipientId === req.user.id) msg.read = true;
    });

    res.json({ messages: conversation });
});

// ==========================================
// STATISTICS ROUTES
// ==========================================

app.get('/api/stats', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    const userDresses = dresses.filter(d => d.sellerId === req.user.id);
    const userSales = transactions.filter(t => t.sellerId === req.user.id);
    const userPurchases = transactions.filter(t => t.buyerId === req.user.id);

    const stats = {
        buttons: user.buttons,
        activeListings: userDresses.filter(d => d.status === 'available').length,
        soldItems: userDresses.filter(d => d.status === 'sold').length,
        totalSales: userSales.length,
        totalPurchases: userPurchases.length,
        totalEarned: userSales.reduce((sum, t) => sum + t.buttonsAmount, 0),
        totalSpent: userPurchases.reduce((sum, t) => sum + t.buttonsAmount, 0),
        totalViews: userDresses.reduce((sum, d) => sum + d.views, 0),
        totalLikes: userDresses.reduce((sum, d) => sum + d.likes, 0)
    };

    res.json(stats);
});

// ==========================================
// DISCOVERY ROUTES
// ==========================================

// Trending dresses
app.get('/api/dresses/trending', (req, res) => {
    const availableDresses = dresses.filter(d => d.status === 'available');
    
    const trending = availableDresses
        .sort((a, b) => (b.likes + b.views * 0.1) - (a.likes + a.views * 0.1))
        .slice(0, 12);

    const trendingWithSeller = trending.map(dress => {
        const seller = users.find(u => u.id === dress.sellerId);
        return {
            ...dress,
            seller: {
                id: seller.id,
                username: seller.username,
                avatar: seller.avatar
            }
        };
    });

    res.json({ dresses: trendingWithSeller });
});

// New arrivals
app.get('/api/dresses/new', (req, res) => {
    const availableDresses = dresses.filter(d => d.status === 'available');
    
    const newArrivals = availableDresses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 12);

    const newArrivalsWithSeller = newArrivals.map(dress => {
        const seller = users.find(u => u.id === dress.sellerId);
        return {
            ...dress,
            seller: {
                id: seller.id,
                username: seller.username,
                avatar: seller.avatar
            }
        };
    });

    res.json({ dresses: newArrivalsWithSeller });
});

// ==========================================
// ROOT & HEALTH ROUTES
// ==========================================

app.get('/', (req, res) => {
    res.json({
        message: '99Dresses API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth/*',
            users: '/api/users/*',
            dresses: '/api/dresses/*',
            transactions: '/api/transactions/*',
            favorites: '/api/favorites/*',
            messages: '/api/messages/*',
            stats: '/api/stats'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
        database: {
            users: users.length,
            dresses: dresses.length,
            transactions: transactions.length
        }
    });
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║          99Dresses Backend Server             ║
╠═══════════════════════════════════════════════╣
║  Status: ✓ Running                            ║
║  Port: ${PORT}                                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                               ║
║  API Endpoints:                               ║
║  → http://localhost:${PORT}                      ║
║  → http://localhost:${PORT}/api/health           ║
║                                               ║
║  Ready to accept requests!                    ║
╚═══════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

module.exports = app;