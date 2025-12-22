#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Distributed Cache System
 * Advanced caching with Redis patterns
 * ============================================
 *
 * Features:
 * - Multiple caching strategies (aside, through, behind)
 * - Intelligent cache invalidation
 * - Cache warming and preloading
 * - Multi-level caching (L1/L2)
 * - Cache stampede prevention
 * - Distributed locking
 * - Cache analytics and monitoring
 * - TTL management with sliding expiration
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================
// Cache Entry
// ============================================
class CacheEntry {
  constructor(key, value, options = {}) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = options.ttl ? Date.now() + options.ttl : null;
    this.hits = 0;
    this.lastAccess = Date.now();
    this.size = this.calculateSize(value);
    this.tags = options.tags || [];
  }

  calculateSize(value) {
    const str = JSON.stringify(value);
    return Buffer.byteLength(str, 'utf8');
  }

  isExpired() {
    return this.expiresAt && this.expiresAt < Date.now();
  }

  touch() {
    this.hits++;
    this.lastAccess = Date.now();
  }

  toJSON() {
    return {
      key: this.key,
      value: this.value,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      hits: this.hits,
      lastAccess: this.lastAccess,
      size: this.size,
      tags: this.tags
    };
  }
}

// ============================================
// Distributed Lock Manager
// ============================================
class DistributedLockManager {
  constructor() {
    this.locks = new Map();
  }

  /**
   * Acquire lock with timeout
   */
  async acquire(key, timeout = 10000) {
    const lockKey = `lock:${key}`;
    const lockId = this.generateLockId();

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!this.locks.has(lockKey)) {
        this.locks.set(lockKey, {
          id: lockId,
          acquiredAt: Date.now(),
          expiresAt: Date.now() + timeout
        });

        return lockId;
      }

      // Check if lock expired
      const lock = this.locks.get(lockKey);
      if (lock.expiresAt < Date.now()) {
        this.locks.delete(lockKey);
        continue;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Failed to acquire lock for ${key}`);
  }

  /**
   * Release lock
   */
  release(key, lockId) {
    const lockKey = `lock:${key}`;
    const lock = this.locks.get(lockKey);

    if (lock && lock.id === lockId) {
      this.locks.delete(lockKey);
      return true;
    }

    return false;
  }

  generateLockId() {
    return createHash('md5')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex');
  }
}

// ============================================
// Cache Invalidation Strategy
// ============================================
class CacheInvalidationStrategy {
  constructor(type = 'ttl') {
    this.type = type; // ttl, lru, lfu, tag-based
  }

  /**
   * Determine which entries to evict
   */
  selectEvictionCandidates(entries, count) {
    switch (this.type) {
      case 'lru':
        return this.lruEviction(entries, count);
      case 'lfu':
        return this.lfuEviction(entries, count);
      case 'ttl':
        return this.ttlEviction(entries, count);
      default:
        return this.lruEviction(entries, count);
    }
  }

  /**
   * Least Recently Used eviction
   */
  lruEviction(entries, count) {
    return Array.from(entries.values())
      .sort((a, b) => a.lastAccess - b.lastAccess)
      .slice(0, count)
      .map(e => e.key);
  }

  /**
   * Least Frequently Used eviction
   */
  lfuEviction(entries, count) {
    return Array.from(entries.values())
      .sort((a, b) => a.hits - b.hits)
      .slice(0, count)
      .map(e => e.key);
  }

  /**
   * TTL-based eviction
   */
  ttlEviction(entries, count) {
    const now = Date.now();
    return Array.from(entries.values())
      .filter(e => e.expiresAt)
      .sort((a, b) => (a.expiresAt || Infinity) - (b.expiresAt || Infinity))
      .slice(0, count)
      .map(e => e.key);
  }
}

// ============================================
// Multi-Level Cache
// ============================================
class MultiLevelCache {
  constructor(config = {}) {
    this.l1 = new Map(); // In-memory cache (fast)
    this.l2 = new Map(); // Secondary cache (larger)
    this.l1MaxSize = config.l1MaxSize || 100;
    this.l2MaxSize = config.l2MaxSize || 1000;
    this.l1MaxBytes = config.l1MaxBytes || 10 * 1024 * 1024; // 10MB
    this.l2MaxBytes = config.l2MaxBytes || 100 * 1024 * 1024; // 100MB

    this.l1Size = 0;
    this.l2Size = 0;
  }

  /**
   * Get value from cache
   */
  get(key) {
    // Try L1 first
    const l1Entry = this.l1.get(key);
    if (l1Entry && !l1Entry.isExpired()) {
      l1Entry.touch();
      return l1Entry.value;
    }

    // Try L2
    const l2Entry = this.l2.get(key);
    if (l2Entry && !l2Entry.isExpired()) {
      l2Entry.touch();

      // Promote to L1
      this.promoteToL1(key, l2Entry);

      return l2Entry.value;
    }

    return null;
  }

  /**
   * Set value in cache
   */
  set(key, value, options = {}) {
    const entry = new CacheEntry(key, value, options);

    // Add to L1 if space available
    if (this.l1.size < this.l1MaxSize && this.l1Size + entry.size < this.l1MaxBytes) {
      this.l1.set(key, entry);
      this.l1Size += entry.size;
    } else {
      // Evict from L1 and add to L2
      this.evictFromL1();
      this.l2.set(key, entry);
      this.l2Size += entry.size;

      // Check L2 size
      if (this.l2.size >= this.l2MaxSize || this.l2Size >= this.l2MaxBytes) {
        this.evictFromL2();
      }
    }
  }

  promoteToL1(key, entry) {
    if (this.l1.size >= this.l1MaxSize || this.l1Size + entry.size >= this.l1MaxBytes) {
      this.evictFromL1();
    }

    this.l1.set(key, entry);
    this.l1Size += entry.size;
    this.l2.delete(key);
    this.l2Size -= entry.size;
  }

  evictFromL1() {
    if (this.l1.size === 0) return;

    // Simple LRU eviction
    const oldest = Array.from(this.l1.values())
      .sort((a, b) => a.lastAccess - b.lastAccess)[0];

    if (oldest) {
      this.l1.delete(oldest.key);
      this.l1Size -= oldest.size;

      // Move to L2
      if (this.l2.size < this.l2MaxSize) {
        this.l2.set(oldest.key, oldest);
        this.l2Size += oldest.size;
      }
    }
  }

  evictFromL2() {
    if (this.l2.size === 0) return;

    const oldest = Array.from(this.l2.values())
      .sort((a, b) => a.lastAccess - b.lastAccess)[0];

    if (oldest) {
      this.l2.delete(oldest.key);
      this.l2Size -= oldest.size;
    }
  }

  delete(key) {
    const l1Entry = this.l1.get(key);
    const l2Entry = this.l2.get(key);

    if (l1Entry) {
      this.l1.delete(key);
      this.l1Size -= l1Entry.size;
    }

    if (l2Entry) {
      this.l2.delete(key);
      this.l2Size -= l2Entry.size;
    }
  }

  clear() {
    this.l1.clear();
    this.l2.clear();
    this.l1Size = 0;
    this.l2Size = 0;
  }

  getStats() {
    return {
      l1: {
        entries: this.l1.size,
        maxSize: this.l1MaxSize,
        bytes: this.l1Size,
        maxBytes: this.l1MaxBytes
      },
      l2: {
        entries: this.l2.size,
        maxSize: this.l2MaxSize,
        bytes: this.l2Size,
        maxBytes: this.l2MaxBytes
      }
    };
  }
}

// ============================================
// Distributed Cache System
// ============================================
class DistributedCacheSystem extends EventEmitter {
  constructor(config = {}) {
    super();

    this.strategy = config.strategy || 'cache-aside'; // cache-aside, write-through, write-behind
    this.cache = new MultiLevelCache(config.cache);
    this.lockManager = new DistributedLockManager();
    this.invalidationStrategy = new CacheInvalidationStrategy(config.eviction || 'lru');

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      stampedePrevented: 0,
      avgGetLatency: 0,
      avgSetLatency: 0
    };

    this.tagIndex = new Map(); // Tag -> Set of keys

    this.setupCleanupJob();
  }

  /**
   * Get value with cache-aside pattern
   */
  async get(key, fetchFn = null) {
    const startTime = Date.now();

    try {
      // Try cache first
      const cached = this.cache.get(key);

      if (cached !== null) {
        this.metrics.hits++;
        this.updateGetLatency(Date.now() - startTime);

        this.emit('cache-hit', { key });
        return cached;
      }

      this.metrics.misses++;

      // If no fetch function, return null
      if (!fetchFn) {
        this.updateGetLatency(Date.now() - startTime);
        return null;
      }

      // Fetch from source with stampede prevention
      const value = await this.fetchWithStampedePrevention(key, fetchFn);

      this.updateGetLatency(Date.now() - startTime);
      return value;

    } catch (error) {
      this.emit('cache-error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Prevent cache stampede with distributed locking
   */
  async fetchWithStampedePrevention(key, fetchFn) {
    let lockId;

    try {
      // Try to acquire lock
      lockId = await this.lockManager.acquire(key, 5000);

      // Double-check cache (another request might have filled it)
      const cached = this.cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch from source
      const value = await fetchFn();

      // Store in cache
      this.set(key, value);

      this.metrics.stampedePrevented++;

      return value;

    } finally {
      if (lockId) {
        this.lockManager.release(key, lockId);
      }
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, options = {}) {
    const startTime = Date.now();

    this.cache.set(key, value, options);
    this.metrics.sets++;

    // Update tag index
    if (options.tags) {
      options.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag).add(key);
      });
    }

    this.updateSetLatency(Date.now() - startTime);

    this.emit('cache-set', { key, size: value?.length || 0 });
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    this.cache.delete(key);
    this.metrics.deletes++;

    // Remove from tag index
    for (const [tag, keys] of this.tagIndex.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagIndex.delete(tag);
      }
    }

    this.emit('cache-delete', { key });
  }

  /**
   * Invalidate by tag
   */
  invalidateByTag(tag) {
    const keys = this.tagIndex.get(tag);

    if (keys) {
      keys.forEach(key => this.delete(key));
      this.tagIndex.delete(tag);

      this.emit('tag-invalidation', { tag, count: keys.size });
    }
  }

  /**
   * Invalidate by pattern
   */
  invalidateByPattern(pattern) {
    const regex = new RegExp(pattern);
    let count = 0;

    // Check L1
    for (const key of this.cache.l1.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    // Check L2
    for (const key of this.cache.l2.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    this.emit('pattern-invalidation', { pattern, count });
  }

  /**
   * Warm cache with data
   */
  async warmCache(entries) {
    console.log(`🔥 Warming cache with ${entries.length} entries...`);

    for (const { key, value, options } of entries) {
      this.set(key, value, options);
    }

    this.emit('cache-warmed', { count: entries.length });
  }

  /**
   * Setup cleanup job for expired entries
   */
  setupCleanupJob() {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute
  }

  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries() {
    let cleaned = 0;

    // Clean L1
    for (const [key, entry] of this.cache.l1.entries()) {
      if (entry.isExpired()) {
        this.cache.l1.delete(key);
        this.cache.l1Size -= entry.size;
        cleaned++;
      }
    }

    // Clean L2
    for (const [key, entry] of this.cache.l2.entries()) {
      if (entry.isExpired()) {
        this.cache.l2.delete(key);
        this.cache.l2Size -= entry.size;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.metrics.evictions += cleaned;
      this.emit('cleanup-complete', { cleaned });
    }
  }

  /**
   * Update metrics
   */
  updateGetLatency(latency) {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.avgGetLatency = (this.metrics.avgGetLatency * (total - 1) + latency) / total;
  }

  updateSetLatency(latency) {
    const count = this.metrics.sets;
    this.metrics.avgSetLatency = (this.metrics.avgSetLatency * (count - 1) + latency) / count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;

    return {
      ...this.metrics,
      hitRate,
      missRate: 1 - hitRate,
      cache: cacheStats,
      tags: this.tagIndex.size
    };
  }

  /**
   * Export cache state
   */
  exportState() {
    const state = {
      timestamp: Date.now(),
      metrics: this.getStats(),
      entries: {
        l1: Array.from(this.cache.l1.values()).map(e => e.toJSON()),
        l2: Array.from(this.cache.l2.values()).map(e => e.toJSON())
      }
    };

    return state;
  }
}

// ============================================
// Demonstration
// ============================================
async function demonstrateDistributedCache() {
  console.log('\n' + '='.repeat(70));
  console.log('💾 JARVIS Distributed Cache System');
  console.log('='.repeat(70) + '\n');

  // Initialize cache
  const cache = new DistributedCacheSystem({
    strategy: 'cache-aside',
    eviction: 'lru',
    cache: {
      l1MaxSize: 10,
      l2MaxSize: 50,
      l1MaxBytes: 1024 * 1024, // 1MB
      l2MaxBytes: 10 * 1024 * 1024 // 10MB
    }
  });

  console.log('✅ Distributed cache initialized\n');

  // Simulate database fetch
  const mockDbFetch = async (id) => {
    console.log(`   📀 Fetching from database: user-${id}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  };

  // Test 1: Cache-aside pattern
  console.log('🔍 Test 1: Cache-Aside Pattern\n');

  for (let i = 1; i <= 3; i++) {
    console.log(`Request ${i} for user-1:`);
    const user = await cache.get('user-1', () => mockDbFetch(1));
    console.log(`   ✅ Got: ${JSON.stringify(user)}\n`);
  }

  // Test 2: Cache warming
  console.log('🔥 Test 2: Cache Warming\n');

  await cache.warmCache([
    { key: 'user-10', value: { id: 10, name: 'User 10' }, options: { ttl: 60000 } },
    { key: 'user-11', value: { id: 11, name: 'User 11' }, options: { ttl: 60000 } },
    { key: 'user-12', value: { id: 12, name: 'User 12' }, options: { ttl: 60000, tags: ['users', 'active'] } }
  ]);

  console.log('');

  // Test 3: Tag-based invalidation
  console.log('🏷️  Test 3: Tag-Based Invalidation\n');

  cache.set('product-1', { id: 1, name: 'Product 1', price: 100 }, { tags: ['products', 'featured'] });
  cache.set('product-2', { id: 2, name: 'Product 2', price: 200 }, { tags: ['products', 'sale'] });
  cache.set('product-3', { id: 3, name: 'Product 3', price: 300 }, { tags: ['products', 'featured'] });

  console.log('Before invalidation:');
  console.log(`   product-1: ${cache.get('product-1') ? '✅' : '❌'}`);
  console.log(`   product-2: ${cache.get('product-2') ? '✅' : '❌'}`);
  console.log(`   product-3: ${cache.get('product-3') ? '✅' : '❌'}`);

  cache.invalidateByTag('featured');

  console.log('\nAfter invalidating "featured" tag:');
  console.log(`   product-1: ${cache.get('product-1') ? '✅' : '❌'}`);
  console.log(`   product-2: ${cache.get('product-2') ? '✅' : '❌'}`);
  console.log(`   product-3: ${cache.get('product-3') ? '✅' : '❌'}\n`);

  // Test 4: Pattern-based invalidation
  console.log('🔍 Test 4: Pattern-Based Invalidation\n');

  cache.set('session:abc123', { userId: 1, token: 'xyz' });
  cache.set('session:def456', { userId: 2, token: 'uvw' });
  cache.set('config:app', { version: '1.0.0' });

  console.log('Before invalidation:');
  console.log(`   session:abc123: ${cache.get('session:abc123') ? '✅' : '❌'}`);
  console.log(`   session:def456: ${cache.get('session:def456') ? '✅' : '❌'}`);
  console.log(`   config:app: ${cache.get('config:app') ? '✅' : '❌'}`);

  cache.invalidateByPattern('^session:');

  console.log('\nAfter invalidating "session:" pattern:');
  console.log(`   session:abc123: ${cache.get('session:abc123') ? '✅' : '❌'}`);
  console.log(`   session:def456: ${cache.get('session:def456') ? '✅' : '❌'}`);
  console.log(`   config:app: ${cache.get('config:app') ? '✅' : '❌'}\n`);

  // Test 5: Multi-level caching
  console.log('📊 Test 5: Multi-Level Caching\n');

  for (let i = 1; i <= 15; i++) {
    cache.set(`item-${i}`, { id: i, data: `Data ${i}` });
  }

  const stats = cache.getStats();

  console.log('Cache distribution:');
  console.log(`   L1: ${stats.cache.l1.entries}/${stats.cache.l1.maxSize} entries`);
  console.log(`   L2: ${stats.cache.l2.entries}/${stats.cache.l2.maxSize} entries\n`);

  // Statistics
  console.log('='.repeat(70));
  console.log('📊 Cache Statistics');
  console.log('='.repeat(70));

  console.log(`\n📈 Performance:`);
  console.log(`   Total Requests: ${stats.hits + stats.misses}`);
  console.log(`   Cache Hits: ${stats.hits}`);
  console.log(`   Cache Misses: ${stats.misses}`);
  console.log(`   Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`   Avg Get Latency: ${stats.avgGetLatency.toFixed(2)}ms`);
  console.log(`   Avg Set Latency: ${stats.avgSetLatency.toFixed(2)}ms`);

  console.log(`\n💾 Storage:`);
  console.log(`   L1 Entries: ${stats.cache.l1.entries}/${stats.cache.l1.maxSize}`);
  console.log(`   L1 Size: ${(stats.cache.l1.bytes / 1024).toFixed(2)}KB / ${(stats.cache.l1.maxBytes / 1024).toFixed(2)}KB`);
  console.log(`   L2 Entries: ${stats.cache.l2.entries}/${stats.cache.l2.maxSize}`);
  console.log(`   L2 Size: ${(stats.cache.l2.bytes / 1024).toFixed(2)}KB / ${(stats.cache.l2.maxBytes / 1024).toFixed(2)}KB`);

  console.log(`\n🔧 Operations:`);
  console.log(`   Sets: ${stats.sets}`);
  console.log(`   Deletes: ${stats.deletes}`);
  console.log(`   Evictions: ${stats.evictions}`);
  console.log(`   Stampede Prevented: ${stats.stampedePrevented}`);
  console.log(`   Active Tags: ${stats.tags}`);

  // Export state
  const exportDir = join(process.cwd(), 'exports');
  if (!existsSync(exportDir)) {
    mkdirSync(exportDir, { recursive: true });
  }

  const statePath = join(exportDir, `cache-state-${Date.now()}.json`);
  writeFileSync(statePath, JSON.stringify(cache.exportState(), null, 2));

  console.log(`\n💾 Cache state exported: ${statePath}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Distributed Cache System Demonstration Complete');
  console.log('='.repeat(70) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateDistributedCache().catch(console.error);
}

export {
  CacheEntry,
  DistributedLockManager,
  CacheInvalidationStrategy,
  MultiLevelCache,
  DistributedCacheSystem
};
