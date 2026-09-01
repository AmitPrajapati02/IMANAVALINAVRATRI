const sql = require('mssql');
const config = require('../config/env');

let pool = null;

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
    return {
      server: parts['data source'] || parts.server || '',
      database: parts['initial catalog'] || parts.database || '',
      user: parts['user id'] || parts.uid || '',
      password: parts.password || parts.pwd || '',
      connectionTimeout: 30000,
      requestTimeout: 60000,
      options: {
        encrypt: (parts['encrypt'] || 'false').toLowerCase() === 'true',
        trustServerCertificate: (parts['trustservercertificate'] || 'true').toLowerCase() === 'true',
      },
    };
  }
  return connectionString;
}

async function getPool() {
  if (pool) return pool;
  const cfg = parseConnectionString(config.databaseUrl);
  if (!cfg) {
    throw new Error('DATABASE_URL is not configured');
  }
  pool = await sql.connect(cfg);
  return pool;
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

module.exports = { sql, getPool, execSp, execSpScalar, insertErrorLog };
