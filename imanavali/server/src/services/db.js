const sql = require('mssql');
const config = require('../config/env');

let pool = null;
let poolPromise = null;

function parseServerAndPort(dataSource) {
  const raw = (dataSource || '').trim();
  if (!raw) return { server: '', port: undefined };
  const commaIdx = raw.lastIndexOf(',');
  if (commaIdx > -1) {
    const maybePort = raw.slice(commaIdx + 1).trim();
    if (/^\d+$/.test(maybePort)) {
      return {
        server: raw.slice(0, commaIdx).trim(),
        port: parseInt(maybePort, 10),
      };
    }
  }
  return { server: raw, port: 1433 };
}

function parseConnectionString(connectionString) {
  if (!connectionString) return null;
  if (connectionString.includes('Server=') || connectionString.includes('Data Source=')) {
    const parts = {};
    connectionString.split(';').forEach((part) => {
      const [k, ...v] = part.split('=');
      if (k && v.length) {
        let val = v.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        parts[k.trim().toLowerCase()] = val;
      }
    });
    const dataSource = parts['data source'] || parts.server || '';
    const { server, port } = parseServerAndPort(dataSource);
    return {
      server,
      port,
      database: parts['initial catalog'] || parts.database || '',
      user: parts['user id'] || parts.uid || '',
      password: parts.password || parts.pwd || '',
      connectionTimeout: 15000,
      requestTimeout: 30000,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      options: {
        encrypt: (parts['encrypt'] || 'false').toLowerCase() === 'true',
        trustServerCertificate: (parts['trustservercertificate'] || 'true').toLowerCase() === 'true',
      },
    };
  }
  return connectionString;
}

function resetPool() {
  pool = null;
  poolPromise = null;
}

async function getPool() {
  if (pool?.connected) return pool;
  if (poolPromise) return poolPromise;

  const cfg = parseConnectionString(config.databaseUrl);
  if (!cfg) {
    throw new Error('DATABASE_URL is not configured');
  }

  poolPromise = sql.connect(cfg)
    .then((connectedPool) => {
      pool = connectedPool;
      pool.on('error', (err) => {
        console.error('SQL pool error:', err.message);
        resetPool();
      });
      return pool;
    })
    .catch((err) => {
      resetPool();
      throw err;
    });

  try {
    return await poolPromise;
  } finally {
    poolPromise = null;
  }
}

async function execSp(procedureName, params = {}) {
  const p = await getPool();
  const request = p.request();
  Object.entries(params).forEach(([key, value]) => {
    const paramName = key.startsWith('@') ? key : `@${key}`;
    request.input(paramName.replace('@', ''), value === undefined ? null : value);
  });
  const result = await request.execute(procedureName);
  return result;
}

async function execSpScalar(procedureName, params = {}) {
  const result = await execSp(procedureName, params);
  return result.recordset?.[0] ?? null;
}

async function insertErrorLog(message, stack = '') {
  try {
    await execSp('sp_insert_error_logs', {
      ErrorMessage: String(message).slice(0, 4000),
      ErrorStack: String(stack).slice(0, 4000),
      Source: 'NodeServer',
    });
  } catch {
    console.error('Failed to log error:', message);
  }
}

module.exports = { sql, getPool, execSp, execSpScalar, insertErrorLog, resetPool };
