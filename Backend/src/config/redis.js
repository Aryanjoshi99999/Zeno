const { redis, createClient } = require("redis");
require("dotenv").config();

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

const pubClient = createClient();
const subClient = createClient();

client.on("error", (err) => console.log("Redis Client Error", err));
client
  .connect()
  .then(() => console.log("Redis connected!"))
  .catch((err) => console.error("Redis connection failed:", err));

module.exports = { client, pubClient, subClient };
