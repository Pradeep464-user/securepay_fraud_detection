const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const dns = require('dns');

// Ensure reliable DNS resolution for MongoDB Atlas SRV clusters
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function ensureMongoRunning(port) {
  const isOpen = await checkPort(port);
  if (isOpen) return;

  console.log(`[MongoDB] Database on port ${port} is not running. Automatically starting standalone MongoDB instance...`);
  const dbPath = path.resolve(__dirname, '../data/db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  const child = spawn('mongod', ['--port', String(port), '--dbpath', dbPath], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkPort(port)) {
      console.log(`[MongoDB] Standalone MongoDB instance successfully started on port ${port}!`);
      return;
    }
  }
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/securepay';

  if (uri.includes('27018')) {
    await ensureMongoRunning(27018);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

