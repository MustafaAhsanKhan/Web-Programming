const mongoose = require('mongoose');

// Mongoose schema — maps to the "users" collection in studentDB
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const UserModel = mongoose.model('User', userSchema);

class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    // Save a new user to MongoDB
    async register() {
        const existing = await UserModel.findOne({ username: this.username });
        if (existing) {
            throw new Error('Username already exists');
        }
        const newUser = new UserModel({
            username: this.username,
            password: this.password,
        });
        await newUser.save();
        return newUser;
    }

    // Placeholder — will be implemented in the next step
    async login() {}
}

module.exports = { User, UserModel };
