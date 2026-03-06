const express = require('express');
const session = require('express-session');
const connectDB = require('./db');
const { User } = require('./User');
const isAuthenticated = require('./middleware/auth');

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));

// POST /register — create a new user account
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User(username, password);
        await user.register();
        res.send('User registered successfully');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// POST /login — authenticate user and create session
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User(username, password);
        const found = await user.login();
        if (!found) {
            return res.status(401).send('Invalid username or password');
        }
        req.session.user = username;
        res.send('Login successful');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /dashboard — protected route, only accessible when logged in
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.send(`Welcome ${req.session.user}`);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
