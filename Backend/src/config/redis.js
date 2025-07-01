const { createClient } = require("redis");
require("dotenv").config();

const client = createClient({
  url: process.env.REDIS_URL,
});

const pubClient = client.duplicate();
const subClient = client.duplicate();

client.on("error", (err) => console.error("Redis Client Error", err));
pubClient.on("error", (err) => console.error("Redis Pub Error", err));
subClient.on("error", (err) => console.error("Redis Sub Error", err));

async function connectRedisClients() {
  try {
    await client.connect();
    await pubClient.connect();
    await subClient.connect();
    console.log("Redis clients connected!");
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
}

connectRedisClients();

module.exports = { client, pubClient, subClient };
