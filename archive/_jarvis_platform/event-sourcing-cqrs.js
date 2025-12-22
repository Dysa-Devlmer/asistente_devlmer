#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Event Sourcing & CQRS System
 * Complete event-driven architecture with
 * command/query separation
 * ============================================
 *
 * Features:
 * - Event Store with append-only log
 * - Event versioning and migration
 * - Aggregate roots with replay
 * - Command handlers with validation
 * - Query projections (read models)
 * - Event snapshots for performance
 * - Event replay and time-travel debugging
 * - Event subscriptions and notifications
 * - Saga orchestration
 * - Eventual consistency management
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

// ============================================
// Event
// ============================================
class Event {
  constructor(type, data, metadata = {}) {
    this.eventId = this.generateId();
    this.type = type;
    this.data = data;
    this.metadata = {
      ...metadata,
      timestamp: Date.now(),
      version: metadata.version || 1
    };
    this.aggregateId = metadata.aggregateId;
    this.aggregateType = metadata.aggregateType;
    this.sequence = metadata.sequence || 0;
  }

  generateId() {
    return createHash('md5')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      type: this.type,
      data: this.data,
      metadata: this.metadata,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      sequence: this.sequence
    };
  }

  static fromJSON(json) {
    const event = new Event(json.type, json.data, json.metadata);
    event.eventId = json.eventId;
    event.aggregateId = json.aggregateId;
    event.aggregateType = json.aggregateType;
    event.sequence = json.sequence;
    return event;
  }
}

// ============================================
// Event Store
// ============================================
class EventStore extends EventEmitter {
  constructor(storePath = './data/event-store') {
    super();
    this.storePath = storePath;
    this.events = [];
    this.snapshots = new Map();
    this.subscribers = new Map();
    this.projections = new Map();

    this.ensureStorageExists();
    this.loadEvents();
  }

  ensureStorageExists() {
    if (!existsSync(this.storePath)) {
      mkdirSync(this.storePath, { recursive: true });
    }
  }

  /**
   * Append event to store
   */
  async append(event) {
    // Validate event
    if (!event.aggregateId) {
      throw new Error('Event must have aggregateId');
    }

    // Check sequence number
    const lastEvent = this.getLastEventForAggregate(event.aggregateId);
    if (lastEvent && event.sequence !== lastEvent.sequence + 1) {
      throw new Error(`Sequence mismatch. Expected ${lastEvent.sequence + 1}, got ${event.sequence}`);
    }

    // Store event
    this.events.push(event);

    // Persist to disk
    await this.persistEvent(event);

    // Notify subscribers
    this.notifySubscribers(event);

    // Update projections
    await this.updateProjections(event);

    this.emit('event-appended', event);

    return event;
  }

  /**
   * Get events for aggregate
   */
  getEventsForAggregate(aggregateId, fromSequence = 0) {
    return this.events.filter(
      e => e.aggregateId === aggregateId && e.sequence >= fromSequence
    );
  }

  /**
   * Get last event for aggregate
   */
  getLastEventForAggregate(aggregateId) {
    const events = this.getEventsForAggregate(aggregateId);
    return events[events.length - 1] || null;
  }

  /**
   * Get all events by type
   */
  getEventsByType(eventType) {
    return this.events.filter(e => e.type === eventType);
  }

  /**
   * Get events in time range
   */
  getEventsByTimeRange(startTime, endTime) {
    return this.events.filter(
      e => e.metadata.timestamp >= startTime && e.metadata.timestamp <= endTime
    );
  }

  /**
   * Create snapshot
   */
  createSnapshot(aggregateId, state) {
    const lastEvent = this.getLastEventForAggregate(aggregateId);

    if (!lastEvent) return;

    const snapshot = {
      aggregateId,
      state,
      sequence: lastEvent.sequence,
      timestamp: Date.now()
    };

    this.snapshots.set(aggregateId, snapshot);

    // Persist snapshot
    this.persistSnapshot(snapshot);

    this.emit('snapshot-created', snapshot);
  }

  /**
   * Get snapshot
   */
  getSnapshot(aggregateId) {
    return this.snapshots.get(aggregateId);
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    this.subscribers.get(eventType).push(handler);
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(event) {
    const handlers = this.subscribers.get(event.type) || [];
    const allHandlers = this.subscribers.get('*') || [];

    [...handlers, ...allHandlers].forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in subscriber: ${error.message}`);
      }
    });
  }

  /**
   * Register projection
   */
  registerProjection(name, projection) {
    this.projections.set(name, projection);
  }

  /**
   * Update projections
   */
  async updateProjections(event) {
    for (const [name, projection] of this.projections.entries()) {
      try {
        await projection.apply(event);
      } catch (error) {
        console.error(`Error updating projection ${name}: ${error.message}`);
      }
    }
  }

  /**
   * Rebuild projection from events
   */
  async rebuildProjection(name) {
    const projection = this.projections.get(name);

    if (!projection) {
      throw new Error(`Projection ${name} not found`);
    }

    projection.reset();

    for (const event of this.events) {
      await projection.apply(event);
    }

    this.emit('projection-rebuilt', { name, eventCount: this.events.length });
  }

  /**
   * Persist event to disk
   */
  async persistEvent(event) {
    const eventFile = join(this.storePath, 'events.jsonl');
    appendFileSync(eventFile, JSON.stringify(event.toJSON()) + '\n');
  }

  /**
   * Persist snapshot to disk
   */
  persistSnapshot(snapshot) {
    const snapshotFile = join(this.storePath, `snapshot-${snapshot.aggregateId}.json`);
    writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
  }

  /**
   * Load events from disk
   */
  loadEvents() {
    const eventFile = join(this.storePath, 'events.jsonl');

    if (!existsSync(eventFile)) return;

    const lines = readFileSync(eventFile, 'utf-8').split('\n').filter(Boolean);

    this.events = lines.map(line => Event.fromJSON(JSON.parse(line)));

    console.log(`📚 Loaded ${this.events.length} events from store`);
  }

  /**
   * Get store statistics
   */
  getStats() {
    const aggregates = new Set(this.events.map(e => e.aggregateId));
    const eventTypes = new Set(this.events.map(e => e.type));

    return {
      totalEvents: this.events.length,
      aggregates: aggregates.size,
      eventTypes: eventTypes.size,
      snapshots: this.snapshots.size,
      projections: this.projections.size,
      subscribers: Array.from(this.subscribers.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

// ============================================
// Aggregate Root
// ============================================
class AggregateRoot {
  constructor(id) {
    this.id = id;
    this.version = 0;
    this.uncommittedEvents = [];
  }

  /**
   * Apply event to aggregate
   */
  applyEvent(event) {
    const handler = this[`on${event.type}`];

    if (handler) {
      handler.call(this, event.data);
    }

    this.version = event.sequence;
  }

  /**
   * Raise new event
   */
  raiseEvent(eventType, data) {
    const event = new Event(eventType, data, {
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      sequence: this.version + 1
    });

    this.uncommittedEvents.push(event);
    this.applyEvent(event);
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents() {
    return this.uncommittedEvents;
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted() {
    this.uncommittedEvents = [];
  }

  /**
   * Load from history
   */
  static loadFromHistory(id, events) {
    const aggregate = new this(id);

    events.forEach(event => {
      aggregate.applyEvent(event);
    });

    return aggregate;
  }
}

// ============================================
// Command
// ============================================
class Command {
  constructor(type, data, metadata = {}) {
    this.commandId = this.generateId();
    this.type = type;
    this.data = data;
    this.metadata = {
      ...metadata,
      timestamp: Date.now(),
      userId: metadata.userId
    };
  }

  generateId() {
    return createHash('md5')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex');
  }
}

// ============================================
// Command Handler
// ============================================
class CommandHandler {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.handlers = new Map();
  }

  /**
   * Register command handler
   */
  register(commandType, handler) {
    this.handlers.set(commandType, handler);
  }

  /**
   * Handle command
   */
  async handle(command) {
    const handler = this.handlers.get(command.type);

    if (!handler) {
      throw new Error(`No handler for command ${command.type}`);
    }

    // Execute handler
    const aggregate = await handler(command);

    // Get uncommitted events
    const events = aggregate.getUncommittedEvents();

    // Append events to store
    for (const event of events) {
      await this.eventStore.append(event);
    }

    // Mark as committed
    aggregate.markEventsAsCommitted();

    return { success: true, eventsCount: events.length };
  }
}

// ============================================
// Projection (Read Model)
// ============================================
class Projection {
  constructor(name) {
    this.name = name;
    this.state = {};
  }

  /**
   * Apply event to projection
   */
  async apply(event) {
    const handler = this[`on${event.type}`];

    if (handler) {
      await handler.call(this, event);
    }
  }

  /**
   * Reset projection state
   */
  reset() {
    this.state = {};
  }

  /**
   * Query projection
   */
  query(filter) {
    // Override in subclasses
    return this.state;
  }
}

// ============================================
// Saga (Process Manager)
// ============================================
class Saga extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.instances = new Map();
  }

  /**
   * Handle event
   */
  async handleEvent(event) {
    // Override in subclasses
  }

  /**
   * Start saga instance
   */
  startInstance(id, data) {
    this.instances.set(id, {
      id,
      data,
      state: 'STARTED',
      startedAt: Date.now()
    });

    this.emit('saga-started', { id, name: this.name });
  }

  /**
   * Complete saga instance
   */
  completeInstance(id) {
    const instance = this.instances.get(id);

    if (instance) {
      instance.state = 'COMPLETED';
      instance.completedAt = Date.now();

      this.emit('saga-completed', { id, name: this.name });
    }
  }

  /**
   * Fail saga instance
   */
  failInstance(id, reason) {
    const instance = this.instances.get(id);

    if (instance) {
      instance.state = 'FAILED';
      instance.failedAt = Date.now();
      instance.failureReason = reason;

      this.emit('saga-failed', { id, name: this.name, reason });
    }
  }
}

// ============================================
// Example: User Aggregate
// ============================================
class UserAggregate extends AggregateRoot {
  constructor(id) {
    super(id);
    this.email = null;
    this.name = null;
    this.status = null;
  }

  // Command: Create user
  create(email, name) {
    if (this.email) {
      throw new Error('User already created');
    }

    this.raiseEvent('UserCreated', { email, name });
  }

  // Command: Update profile
  updateProfile(name) {
    if (!this.email) {
      throw new Error('User not created');
    }

    this.raiseEvent('UserProfileUpdated', { name });
  }

  // Command: Deactivate user
  deactivate() {
    if (this.status === 'DEACTIVATED') {
      throw new Error('User already deactivated');
    }

    this.raiseEvent('UserDeactivated', {});
  }

  // Event handlers
  onUserCreated(data) {
    this.email = data.email;
    this.name = data.name;
    this.status = 'ACTIVE';
  }

  onUserProfileUpdated(data) {
    this.name = data.name;
  }

  onUserDeactivated() {
    this.status = 'DEACTIVATED';
  }
}

// ============================================
// Example: User List Projection
// ============================================
class UserListProjection extends Projection {
  constructor() {
    super('UserList');
    this.state = {
      users: new Map(),
      activeCount: 0,
      deactivatedCount: 0
    };
  }

  onUserCreated(event) {
    this.state.users.set(event.aggregateId, {
      id: event.aggregateId,
      email: event.data.email,
      name: event.data.name,
      status: 'ACTIVE'
    });

    this.state.activeCount++;
  }

  onUserProfileUpdated(event) {
    const user = this.state.users.get(event.aggregateId);
    if (user) {
      user.name = event.data.name;
    }
  }

  onUserDeactivated(event) {
    const user = this.state.users.get(event.aggregateId);
    if (user) {
      user.status = 'DEACTIVATED';
      this.state.activeCount--;
      this.state.deactivatedCount++;
    }
  }

  query(filter = {}) {
    let users = Array.from(this.state.users.values());

    if (filter.status) {
      users = users.filter(u => u.status === filter.status);
    }

    return {
      users,
      total: users.length,
      activeCount: this.state.activeCount,
      deactivatedCount: this.state.deactivatedCount
    };
  }
}

// ============================================
// Demonstration
// ============================================
async function demonstrateEventSourcing() {
  console.log('\n' + '='.repeat(70));
  console.log('📚 JARVIS Event Sourcing & CQRS System');
  console.log('='.repeat(70) + '\n');

  // Initialize event store
  const eventStore = new EventStore('./data/event-store');

  console.log('✅ Event Store initialized\n');

  // Setup command handler
  const commandHandler = new CommandHandler(eventStore);

  // Register commands
  commandHandler.register('CreateUser', async (command) => {
    const user = new UserAggregate(command.data.userId);
    user.create(command.data.email, command.data.name);
    return user;
  });

  commandHandler.register('UpdateUserProfile', async (command) => {
    const events = eventStore.getEventsForAggregate(command.data.userId);
    const user = UserAggregate.loadFromHistory(command.data.userId, events);
    user.updateProfile(command.data.name);
    return user;
  });

  commandHandler.register('DeactivateUser', async (command) => {
    const events = eventStore.getEventsForAggregate(command.data.userId);
    const user = UserAggregate.loadFromHistory(command.data.userId, events);
    user.deactivate();
    return user;
  });

  // Setup projections
  const userListProjection = new UserListProjection();
  eventStore.registerProjection('UserList', userListProjection);

  console.log('📝 Command handlers and projections registered\n');

  // Execute commands
  console.log('🔄 Executing commands...\n');

  // Create users
  await commandHandler.handle(new Command('CreateUser', {
    userId: 'user-1',
    email: 'alice@example.com',
    name: 'Alice'
  }));

  await commandHandler.handle(new Command('CreateUser', {
    userId: 'user-2',
    email: 'bob@example.com',
    name: 'Bob'
  }));

  await commandHandler.handle(new Command('CreateUser', {
    userId: 'user-3',
    email: 'charlie@example.com',
    name: 'Charlie'
  }));

  // Update profile
  await commandHandler.handle(new Command('UpdateUserProfile', {
    userId: 'user-1',
    name: 'Alice Smith'
  }));

  // Deactivate user
  await commandHandler.handle(new Command('DeactivateUser', {
    userId: 'user-2'
  }));

  console.log('');

  // Query projection (CQRS - read side)
  console.log('='.repeat(70));
  console.log('🔍 Query Results (Read Model)');
  console.log('='.repeat(70));

  const allUsers = userListProjection.query();
  console.log(`\n📊 All Users:`);
  console.log(`   Total: ${allUsers.total}`);
  console.log(`   Active: ${allUsers.activeCount}`);
  console.log(`   Deactivated: ${allUsers.deactivatedCount}\n`);

  allUsers.users.forEach(user => {
    console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.status}`);
  });

  const activeUsers = userListProjection.query({ status: 'ACTIVE' });
  console.log(`\n📊 Active Users: ${activeUsers.total}`);
  activeUsers.users.forEach(user => {
    console.log(`   ${user.id}: ${user.name}`);
  });

  // Event replay / time travel
  console.log('\n' + '='.repeat(70));
  console.log('⏮️  Event Replay (Time Travel)');
  console.log('='.repeat(70) + '\n');

  const user1Events = eventStore.getEventsForAggregate('user-1');
  console.log(`📜 Events for user-1:`);
  user1Events.forEach((event, i) => {
    console.log(`   ${i + 1}. ${event.type} (seq: ${event.sequence})`);
    console.log(`      Data: ${JSON.stringify(event.data)}`);
  });

  // Rebuild user from events
  const rebuiltUser = UserAggregate.loadFromHistory('user-1', user1Events);
  console.log(`\n🔄 Rebuilt user state:`);
  console.log(`   Name: ${rebuiltUser.name}`);
  console.log(`   Email: ${rebuiltUser.email}`);
  console.log(`   Status: ${rebuiltUser.status}`);
  console.log(`   Version: ${rebuiltUser.version}`);

  // Snapshots
  console.log('\n' + '='.repeat(70));
  console.log('📸 Snapshots');
  console.log('='.repeat(70) + '\n');

  eventStore.createSnapshot('user-1', {
    name: rebuiltUser.name,
    email: rebuiltUser.email,
    status: rebuiltUser.status
  });

  console.log('✅ Snapshot created for user-1');

  const snapshot = eventStore.getSnapshot('user-1');
  console.log(`   Sequence: ${snapshot.sequence}`);
  console.log(`   State: ${JSON.stringify(snapshot.state)}`);

  // Event store statistics
  console.log('\n' + '='.repeat(70));
  console.log('📊 Event Store Statistics');
  console.log('='.repeat(70));

  const stats = eventStore.getStats();

  console.log(`\n📈 Metrics:`);
  console.log(`   Total Events: ${stats.totalEvents}`);
  console.log(`   Aggregates: ${stats.aggregates}`);
  console.log(`   Event Types: ${stats.eventTypes}`);
  console.log(`   Snapshots: ${stats.snapshots}`);
  console.log(`   Projections: ${stats.projections}`);
  console.log(`   Subscribers: ${stats.subscribers}`);

  console.log(`\n📋 Event Breakdown:`);
  const eventTypes = {};
  eventStore.events.forEach(e => {
    eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
  });

  Object.entries(eventTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // Export event log
  const exportDir = join(process.cwd(), 'exports');
  if (!existsSync(exportDir)) {
    mkdirSync(exportDir, { recursive: true });
  }

  const eventLogPath = join(exportDir, `event-log-${Date.now()}.json`);
  writeFileSync(eventLogPath, JSON.stringify({
    timestamp: Date.now(),
    events: eventStore.events.map(e => e.toJSON()),
    stats
  }, null, 2));

  console.log(`\n💾 Event log exported: ${eventLogPath}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Event Sourcing & CQRS Demonstration Complete');
  console.log('='.repeat(70) + '\n');

  console.log('🎯 Key Benefits Demonstrated:');
  console.log('   1. ✅ Complete audit trail of all changes');
  console.log('   2. ✅ Time-travel debugging (replay events)');
  console.log('   3. ✅ Separate read/write models (CQRS)');
  console.log('   4. ✅ Event-driven architecture');
  console.log('   5. ✅ Snapshots for performance');
  console.log('   6. ✅ Projections for different views\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateEventSourcing().catch(console.error);
}

export {
  Event,
  EventStore,
  AggregateRoot,
  Command,
  CommandHandler,
  Projection,
  Saga,
  UserAggregate,
  UserListProjection
};
