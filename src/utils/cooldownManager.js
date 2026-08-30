/**
 * Memory-safe Cooldown & Debounce Manager with automatic TTL pruning
 */
class CooldownManager {
  constructor(defaultTtlMs = 1500, maxEntries = 10000) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
    this.map = new Map();

    // Auto-prune expired keys every 60 seconds to prevent memory leaks
    this.pruneInterval = setInterval(() => {
      this.prune();
    }, 60000);

    // Unref interval so it does not block process exit
    if (this.pruneInterval.unref) {
      this.pruneInterval.unref();
    }
  }

  /**
   * Check if a key is on cooldown
   * @param {string} key
   * @param {number} [ttlMs]
   * @returns {{ onCooldown: boolean, remainingMs: number }}
   */
  check(key, ttlMs = this.defaultTtlMs) {
    const now = Date.now();
    const expiresAt = this.map.get(key);

    if (expiresAt && now < expiresAt) {
      return { onCooldown: true, remainingMs: expiresAt - now };
    }

    // Safety guard against memory bloat
    if (this.map.size >= this.maxEntries) {
      this.prune();
    }

    this.map.set(key, now + ttlMs);
    return { onCooldown: false, remainingMs: 0 };
  }

  /**
   * Remove expired keys from memory
   */
  prune() {
    const now = Date.now();
    for (const [key, expiresAt] of this.map.entries()) {
      if (now >= expiresAt) {
        this.map.delete(key);
      }
    }
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear() {
    this.map.clear();
  }

  /**
   * Destroy interval timer
   */
  destroy() {
    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
    }
    this.map.clear();
  }
}

module.exports = { CooldownManager };
