/**
 * Free the API port before dev/start so nodemon never leaves an orphan serving old code.
 * Usage: node scripts/free-api-port.js [port]
 * Default port: 3001 (or PORT env)
 */
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
  process.exit(0);
}

const { execSync } = require('child_process');

const port = parseInt(process.argv[2] || process.env.PORT || '3001', 10);

function freePortWindows(p) {
  try {
    const out = execSync(`netstat -ano | findstr :${p}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.includes('LISTENING')) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parseInt(parts[parts.length - 1], 10);
      if (pid > 0) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[free-api-port] Stopped PID ${pid} on port ${p}`);
      } catch {
        // already gone
      }
    }
    if (!pids.size) console.log(`[free-api-port] Port ${p} is free`);
  } catch {
    console.log(`[free-api-port] Port ${p} is free`);
  }
}

function freePortUnix(p) {
  try {
    const out = execSync(`lsof -ti :${p}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (!out) {
      console.log(`[free-api-port] Port ${p} is free`);
      return;
    }
    const pids = out.split(/\s+/).filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`[free-api-port] Stopped PID ${pid} on port ${p}`);
      } catch {
        // already gone
      }
    }
  } catch {
    console.log(`[free-api-port] Port ${p} is free`);
  }
}

if (process.platform === 'win32') freePortWindows(port);
else freePortUnix(port);
