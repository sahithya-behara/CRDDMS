// services/realtime.service.js — Centralized Institutional Real-Time Event Hub (SSE)
import { EventEmitter } from 'events';

class RealtimeService extends EventEmitter {
  constructor() {
    super();
    // Map of clientId -> { id, res, user: { id, email, role, department_id } }
    this.clients = new Map();

    // Start keepalive heartbeat every 25 seconds
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
    this.heartbeatTimer.unref(); // allow process to exit cleanly if idle
  }

  /**
   * Register an authenticated client connection
   */
  addClient(clientId, res, user, req) {
    this.clients.set(clientId, { id: clientId, res, user });

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({
      status: 'connected',
      clientId,
      userId: user.id,
      role: user.role,
      departmentId: user.department_id,
      timestamp: new Date().toISOString(),
    })}\n\n`);

    console.log(`📡 Real-Time Client Connected [${clientId}] User: ${user.email} (${user.role})`);

    req.on('close', () => {
      this.clients.delete(clientId);
      console.log(`📡 Real-Time Client Disconnected [${clientId}]`);
    });
  }

  /**
   * Keep proxies and browsers alive with comment pings
   */
  sendHeartbeat() {
    if (this.clients.size === 0) return;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(': ping\n\n');
      } catch (err) {
        this.clients.delete(id);
      }
    }
  }

  /**
   * Broadcast an event to authorized clients
   * @param {string} eventName - e.g. 'DOCUMENT_CREATED', 'DOCUMENT_STATUS_CHANGED'
   * @param {object} payload - event details
   * @param {function} [filterFn] - optional custom client filter
   */
  broadcastEvent(eventName, payload = {}, filterFn = null) {
    const dataString = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    });

    let dispatchedCount = 0;

    for (const [id, client] of this.clients.entries()) {
      try {
        // Evaluate role and department security
        const isAuthorized = filterFn
          ? filterFn(client.user)
          : this.defaultAuthorizationFilter(client.user, payload);

        if (isAuthorized) {
          client.res.write(`event: ${eventName}\ndata: ${dataString}\n\n`);
          dispatchedCount++;
        }
      } catch (err) {
        console.error(`Failed sending realtime event to client ${id}:`, err.message);
        this.clients.delete(id);
      }
    }

    if (dispatchedCount > 0) {
      console.log(`⚡ Real-Time Broadcast [${eventName}] dispatched to ${dispatchedCount} active client(s)`);
    }
  }

  /**
   * Default institutional access-control rules for broadcasts
   */
  defaultAuthorizationFilter(user, payload) {
    // Super admins and institutional admins receive all broadcasts
    if (user.role === 'super_admin' || user.role === 'admin') {
      return true;
    }

    // Compliance reviewers receive compliance, review, and accreditation events
    if (user.role === 'compliance_reviewer') {
      if (
        payload.category === 'accreditation_documents' ||
        payload.authority ||
        payload.isCompliance ||
        payload.status === 'under_review' ||
        payload.status === 'approved'
      ) {
        return true;
      }
    }

    // Department Heads, Faculty, and Staff receive events from their own department or global announcements
    if (payload.department_id) {
      return Number(payload.department_id) === Number(user.department_id);
    }

    // Public / institutional announcements are sent to all authenticated users
    if (payload.isGlobal || payload.isPublic) {
      return true;
    }

    return false;
  }

  getActiveClientsCount() {
    return this.clients.size;
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
