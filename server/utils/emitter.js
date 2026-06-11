/**
 * utils/emitter.js
 *
 * Singleton EventEmitter. Services emit events here.
 * server.js wires socket.io listeners to this emitter.
 *
 * WHY a singleton instead of importing io directly?
 *  Services (OrderService, SupportService) are loaded before server.js
 *  finishes setting up socket.io. Direct import would be a circular dependency.
 *  The emitter pattern breaks the cycle:
 *    Service → emitter (no circular) → server.js listens and forwards to io
 *
 * USAGE in a service:
 *   import { getEmitter } from '../utils/emitter.js';
 *   getEmitter().emit('order:paid', { orderId, amount });
 *
 * USAGE in server.js:
 *   import { getEmitter } from './utils/emitter.js';
 *   const emitter = getEmitter();
 *   io.on('connection', (socket) => {
 *     emitter.on('order:paid',      (data) => io.to('admins').emit('order:paid',      data));
 *     emitter.on('ticket:created',  (data) => io.to('admins').emit('ticket:created',  data));
 *     emitter.on('ticket:updated',  (data) => io.to('admins').emit('ticket:updated',  data));
 *     emitter.on('ticket:message',  (data) => io.to('admins').emit('ticket:message',  data));
 *   });
 *
 * Events emitted:
 *   order:paid       { orderId, orderNumber, amount, currency }
 *   order:cancelled  { orderId, orderNumber }
 *   ticket:created   { ticketId, ticketNumber, subject, priority }
 *   ticket:updated   { ticketId, status, actorId }
 *   ticket:message   { ticketId, messageId, senderType, isInternal }
 */

import EventEmitter from 'events';

let _emitter = null;

export const getEmitter = () => {
  if (!_emitter) {
    _emitter = new EventEmitter();
    _emitter.setMaxListeners(50);   // prevent spurious "memory leak" warnings
  }
  return _emitter;
};
