const express = require('express');
const connectDB = require('./db');

const app = express();
const PORT = 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
