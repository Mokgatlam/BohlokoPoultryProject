/**
 * Knex Configuration — MySQL (development) / PostgreSQL (production)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Production: always prefer DATABASE_URL from Render env vars
// dotenv never overrides existing process.env values, so Render's
// DATABASE_URL takes priority even if .env is loaded first.
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('KNEXFILE WARNING: DATABASE_URL is not set. Falling back to individual DB_* vars.');
}

const productionConfig = {
  client: 'pg',
  connection: dbUrl ? {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bohloko_farm',
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bohloko_farm',
      charset: 'utf8mb4',
      timezone: '+00:00'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: productionConfig
};
