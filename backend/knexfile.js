/**
 * Knex Configuration — MySQL Database
 * 
 * Configuration for MySQL database connection.
 * Update the credentials below to match your MySQL setup.
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const productionConfig = process.env.DATABASE_URL ? {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
} : {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bohloko_farm',
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 20
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
