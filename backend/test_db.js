// test-db.js
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to DB");
    process.exit();
  })
  .catch(err => {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  });