const admin = require('firebase-admin');

let initialized = false;

function initializeFirebase() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return true;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  try {
    if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson))
      });
    } else if (serviceAccountPath) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.warn('Firebase Admin non configurato: notifiche push disabilitate');
      return false;
    }
    initialized = true;
    return true;
  } catch (error) {
    console.warn(`Firebase Admin init fallita: ${error.message}`);
    return false;
  }
}

async function sendPaymentConfirmedNotification({ token, payment }) {
  if (!token) return null;
  if (!initializeFirebase()) return null;

  return admin.messaging().send({
    token,
    notification: {
      title: 'Pagamento Monero confermato',
      body: `Pagamento ${payment.amount} XMR ricevuto su MyZubster.`
    },
    data: {
      type: 'payment_confirmed',
      paymentId: payment.paymentId,
      amount: String(payment.amount),
      status: 'confirmed'
    }
  });
}

module.exports = {
  initializeFirebase,
  sendPaymentConfirmedNotification
};
