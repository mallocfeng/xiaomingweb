import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

let poolPromise = null;

function buildConfig() {
  return {
    server: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      enableArithAbort: true,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

export function getConnectionPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(buildConfig()).catch(error => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

export async function closeConnectionPool() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
}
