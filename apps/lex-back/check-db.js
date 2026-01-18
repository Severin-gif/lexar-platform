process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';  // 👈 только для локального теста
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // 👈 дублируем на всякий случай
});

client.connect()
  .then(() => { console.log("✅ Успешное подключение к БД"); return client.end(); })
  .catch(err => { console.error("❌ Ошибка подключения:", err.message); });
