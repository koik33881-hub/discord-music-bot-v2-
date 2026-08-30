const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCK_FILE = path.join(process.cwd(), '.bot.lock');

/**
 * Ensures only one instance of the bot runs per machine/environment
 * Prevents voice session conflicts, double command executions, and Discord API collisions.
 */
class InstanceLock {
  /**
   * Acquire exclusive lock or gracefully terminate if another instance is active
   */
  static acquire() {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const data = fs.readFileSync(LOCK_FILE, 'utf-8');
        try {
          const lock = JSON.parse(data);
          const isAlive = this.isProcessAlive(lock.pid);

          if (isAlive && lock.pid !== process.pid) {
            console.error('\n=============================================================');
            console.error('🚨 [ANTI-COLLISION SYSTEM ACTIVATED]');
            console.error(`⚠️ Another bot instance is already running on this system!`);
            console.error(`   Active Process PID : ${lock.pid}`);
            console.error(`   Started At         : ${lock.startedAt}`);
            console.error(`   Host / Machine     : ${lock.hostname}`);
            console.error('🛑 Startup aborted to prevent Discord Voice & Command collisions.');
            console.error('=============================================================\n');
            process.exit(0);
          }
        } catch (_) {
          // Corrupted lock file, safely overwrite
        }
      }

      // Write current instance lock
      const lockPayload = {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        hostname: os.hostname(),
        platform: process.platform,
        nodeVersion: process.version,
      };

      fs.writeFileSync(LOCK_FILE, JSON.stringify(lockPayload, null, 2), 'utf-8');

      // Register cleanup handlers
      const cleanUp = () => {
        try {
          if (fs.existsSync(LOCK_FILE)) {
            const content = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
            if (content.pid === process.pid) {
              fs.unlinkSync(LOCK_FILE);
            }
          }
        } catch (_) {}
      };

      process.on('exit', cleanUp);
      process.on('SIGINT', () => {
        cleanUp();
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        cleanUp();
        process.exit(0);
      });

      console.log(`🛡️ [Anti-Collision] Instance lock acquired successfully (PID: ${process.pid}).`);
    } catch (error) {
      console.warn('⚠️ [InstanceLock] Warning while managing lock file:', error.message);
    }
  }

  /**
   * Checks if a process with given PID is currently active
   * @param {number} pid
   * @returns {boolean}
   */
  static isProcessAlive(pid) {
    if (!pid || typeof pid !== 'number') return false;
    try {
      // Signal 0 tests for process existence without killing it
      process.kill(pid, 0);
      return true;
    } catch (e) {
      // ESRCH means process does not exist
      return e.code === 'EPERM';
    }
  }
}

module.exports = { InstanceLock };
