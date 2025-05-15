const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();

//App config
const app = express();
const port = process.env.PORT;

//database connection
connectDB();

app.use(express.json());
app.use(cors());

// API endpoints

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(port, () => {
  console.log(`server is started on http://localhost:${port}`);
});
