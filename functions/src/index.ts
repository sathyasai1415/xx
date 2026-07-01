import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
db.settings({ databaseId: 'pizza' });

// ── Helpers ────────────────────────────────────────────────────────────────

function generateQrToken(): string {
  const bytes = require('crypto').randomBytes(16) as Buffer;
  return bytes.toString('hex');
}

async function logAudit(action: string, actorUid: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await db.collection('audit').add({
    action, actorUid, targetId, metadata,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ── onOrderCreated: stamp QR token, notify store owner ────────────────────
//
// Triggers on every new document in /orders. Adds a qrToken (if missing)
// and sends an FCM notification to the store owner so they see new orders
// in real time without polling.

export const onOrderCreated = functions.firestore.onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const order = event.data?.data();
    const orderId = event.params.orderId;
    if (!order) return;

    const updates: Record<string, unknown> = {};

    // Stamp QR token if not already set (client may have set it, but we
    // overwrite with a server-generated one to prevent tampering)
    updates.qrToken = generateQrToken();

    // Ensure customerId mirrors userId for rule consistency
    if (!order.customerId && order.userId) {
      updates.customerId = order.userId;
    }

    await event.data!.ref.update(updates);

    // Notify store owner via FCM
    const storeId: string = order.storeId ?? order.store_id;
    if (!storeId) return;

    try {
      const storeSnap = await db.collection('stores').doc(storeId).get();
      const ownerUid: string | undefined = storeSnap.data()?.ownerUid;
      if (!ownerUid) return;

      const userSnap = await db.collection('users').doc(ownerUid).get();
      const fcmToken: string | undefined = userSnap.data()?.fcmToken;
      if (!fcmToken) return;

      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: '🍕 New Order!',
          body: `Order #${orderId.slice(-6).toUpperCase()} just came in — check your dashboard.`,
        },
        data: { orderId, storeId },
      });
    } catch (err) {
      // FCM failures are non-fatal
      functions.logger.warn('FCM notification failed', { orderId, err });
    }

    await logAudit('order.created', order.userId ?? 'unknown', orderId, {
      storeId,
      total: order.total ?? order.finalTotal,
    });
  }
);

// ── onOrderStatusChanged: notify customer when their order status changes ──

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed:        { title: '✅ Order Confirmed!',    body: 'Your pizza is being prepared.' },
  preparing:        { title: '👨‍🍳 Preparing your order', body: 'The kitchen is on it!' },
  READY:            { title: '📦 Ready for Pickup!',   body: 'Your order is ready.' },
  ready:            { title: '📦 Ready for Pickup!',   body: 'Your order is ready.' },
  ready_for_pickup: { title: '📦 Ready for Pickup!',   body: 'Your order is ready.' },
  OUT_FOR_DELIVERY: { title: '🛵 On the Way!',         body: 'Your pizza is out for delivery.' },
  out_for_delivery: { title: '🛵 On the Way!',         body: 'Your pizza is out for delivery.' },
  DELIVERED:        { title: '🍕 Delivered!',          body: 'Enjoy your pizza!' },
  delivered:        { title: '🍕 Delivered!',          body: 'Enjoy your pizza!' },
  CANCELLED:        { title: '❌ Order Cancelled',      body: 'Your order was cancelled. Contact support if needed.' },
  cancelled:        { title: '❌ Order Cancelled',      body: 'Your order was cancelled. Contact support if needed.' },
};

export const onOrderStatusChanged = functions.firestore.onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    const prevStatus = before.status ?? before.orderStatus;
    const newStatus  = after.status  ?? after.orderStatus;
    if (prevStatus === newStatus) return;

    const msg = STATUS_MESSAGES[newStatus];
    if (!msg) return;

    const customerId: string = after.customerId ?? after.userId;
    if (!customerId) return;

    try {
      const userSnap = await db.collection('users').doc(customerId).get();
      const fcmToken: string | undefined = userSnap.data()?.fcmToken;
      if (!fcmToken) return;

      await admin.messaging().send({
        token: fcmToken,
        notification: { title: msg.title, body: msg.body },
        data: { orderId: event.params.orderId, status: newStatus },
      });
    } catch (err) {
      functions.logger.warn('Customer FCM failed', { orderId: event.params.orderId, err });
    }
  }
);

// ── verifyDeliveryPartnerScan: HTTP callable ───────────────────────────────
//
// Called by the delivery partner app when they scan the QR code on the
// order bag. Validates:
//   1. Order is in READY status
//   2. Submitted QR token matches the order's qrToken
//   3. Order hasn't already been scanned
// On success, advances the order to OUT_FOR_DELIVERY / picked_up.

export const verifyDeliveryPartnerScan = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { orderId, qrToken } = request.data as { orderId: string; qrToken: string };
    if (!orderId || !qrToken) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and qrToken are required.');
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    const order = orderSnap.data()!;

    if (order.qrScannedAt) {
      throw new functions.https.HttpsError('already-exists', 'This order has already been picked up.');
    }

    const readyStatuses = ['READY', 'ready', 'ready_for_pickup'];
    if (!readyStatuses.includes(order.status ?? order.orderStatus)) {
      throw new functions.https.HttpsError('failed-precondition', `Order is not ready for pickup (status: ${order.status ?? order.orderStatus}).`);
    }

    if (order.qrToken !== qrToken) {
      await logAudit('order.scan.rejected', request.auth.uid, orderId, {
        reason: 'token_mismatch',
      });
      throw new functions.https.HttpsError('permission-denied', 'QR code does not match this order.');
    }

    await orderRef.update({
      status: 'OUT_FOR_DELIVERY',
      orderStatus: 'out_for_delivery',
      qrScannedAt: admin.firestore.FieldValue.serverTimestamp(),
      'deliveryPartner.uid': request.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAudit('order.scan.verified', request.auth.uid, orderId, {
      storeId: order.storeId,
    });

    return { success: true, orderId };
  }
);

// ── processStorePayout: HTTP callable (admin only) ────────────────────────
//
// Aggregates all DELIVERED orders for a store in a date range, calculates
// the restaurant payout (after 20% platform fee), and writes a payout record.

export const processStorePayout = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    // Verify caller is admin
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    if (userSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin only.');
    }

    const { storeId, periodStart, periodEnd } = request.data as {
      storeId: string;
      periodStart: string; // ISO date string
      periodEnd: string;
    };

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const ordersSnap = await db.collection('orders')
      .where('storeId', '==', storeId)
      .where('status', '==', 'DELIVERED')
      .get();

    const orders = ordersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((o: any) => {
        const createdAt = o.createdAt?.toDate?.() ?? new Date(o.createdAt ?? 0);
        return createdAt >= start && createdAt <= end;
      }) as any[];

    const PLATFORM_FEE = 0.20;
    const grossRevenue = orders.reduce((sum: number, o: any) => sum + (o.subtotal ?? 0), 0);
    const platformFee = grossRevenue * PLATFORM_FEE;
    const restaurantPayout = grossRevenue - platformFee;

    const payoutRef = await db.collection('payouts').add({
      storeId,
      periodStart: start,
      periodEnd: end,
      orderCount: orders.length,
      grossRevenue,
      platformFee,
      restaurantPayout,
      status: 'pending',
      orderIds: orders.map((o: any) => o.id),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAudit('payout.created', request.auth.uid, payoutRef.id, {
      storeId,
      restaurantPayout,
    });

    return { payoutId: payoutRef.id, restaurantPayout, orderCount: orders.length };
  }
);

// ── weeklyAIInsights: scheduled every Monday at 8 AM ET ──────────────────
//
// Aggregates platform-wide order data, calls the AI layer, and writes a
// summary to /admin/weeklyReport so the PlatformAdmin AIInsightsTab can
// display live-updated insights without expensive on-demand queries.

export const weeklyAIInsights = functions.scheduler.onSchedule(
  { schedule: 'every monday 08:00', timeZone: 'America/Detroit' },
  async () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const ordersSnap = await db.collection('orders').get();
    const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const recentOrders = allOrders.filter((o: any) => {
      const t = o.createdAt?.toDate?.() ?? new Date(o.createdAt ?? 0);
      return t >= oneWeekAgo;
    });

    const totalRevenue = recentOrders.reduce((s: number, o: any) => s + (o.subtotal ?? o.finalTotal ?? 0), 0);
    const cancelCount = recentOrders.filter((o: any) =>
      ['CANCELLED', 'cancelled'].includes(o.status ?? o.orderStatus ?? '')
    ).length;
    const cancelRate = recentOrders.length > 0 ? (cancelCount / recentOrders.length) * 100 : 0;

    // Revenue by store
    const byStore: Record<string, number> = {};
    for (const o of recentOrders) {
      if (o.storeId) byStore[o.storeId] = (byStore[o.storeId] ?? 0) + (o.subtotal ?? 0);
    }
    const topStore = Object.entries(byStore).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    await db.collection('admin').doc('weeklyReport').set({
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      weekOf: oneWeekAgo.toISOString(),
      orderCount: recentOrders.length,
      totalRevenue,
      cancelRate: Math.round(cancelRate * 10) / 10,
      topStoreId: topStore,
      revenueByStore: byStore,
    }, { merge: false });

    functions.logger.info('Weekly AI insights written', { orderCount: recentOrders.length, totalRevenue });
  }
);

// ── sendBroadcastNotification: admin sends a custom push to all customers ──
//
// Called from the admin dashboard. Collects all customer FCM tokens and
// sends them a custom title + body in batches of 500 (FCM multicast limit).

export const sendBroadcastNotification = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    // Only admins or store owners can send broadcasts
    const callerSnap = await db.collection('users').doc(request.auth.uid).get();
    const callerRole = callerSnap.data()?.role;
    if (!['admin', 'store_owner'].includes(callerRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins and store owners can send broadcasts.');
    }

    const { title, body, targetRole = 'customer', storeId } = request.data as {
      title: string;
      body: string;
      targetRole?: 'customer' | 'all';
      storeId?: string;
    };

    if (!title?.trim() || !body?.trim()) {
      throw new functions.https.HttpsError('invalid-argument', 'title and body are required.');
    }

    // Collect FCM tokens from users
    let query: FirebaseFirestore.Query = db.collection('users');
    if (targetRole === 'customer') {
      query = query.where('role', '==', 'customer');
    }

    const usersSnap = await query.get();
    const tokens: string[] = usersSnap.docs
      .map(d => d.data()?.fcmToken as string | undefined)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) {
      return { sent: 0, message: 'No users with FCM tokens found.' };
    }

    // Send in batches of 500 (FCM limit)
    const BATCH = 500;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      const result = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: { storeId: storeId ?? '', type: 'broadcast' },
      });
      successCount += result.successCount;
      failCount += result.failureCount;
    }

    // Log the broadcast
    await db.collection('broadcasts').add({
      title,
      body,
      targetRole,
      storeId: storeId ?? null,
      sentBy: request.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount,
      failCount,
      totalTokens: tokens.length,
    });

    functions.logger.info('Broadcast sent', { title, successCount, failCount });
    return { sent: successCount, failed: failCount, total: tokens.length };
  }
);
