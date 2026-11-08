const { execFile } = require('child_process');

async function execFileNoThrow(file, args, options = {}) {
  return new Promise((resolve) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        error: error || null,
        status: error ? (error.code || 1) : 0,
      });
    });
  });
}

module.exports = { execFileNoThrow };
