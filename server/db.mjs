import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

let poolPromise = null;

function buildConfig() {
  const encrypt = String(process.env.DB_ENCRYPT ?? 'false').toLowerCase() === 'true';
  const serverName = (process.env.DB_SERVER_NAME || '').trim();

  const options = {
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt
  };

  if (encrypt && serverName.length) {
    options.serverName = serverName;
  }

  return {
    server: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options,
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
