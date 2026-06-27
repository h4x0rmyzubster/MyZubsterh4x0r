package com.myzubster.services

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.myzubster.R
import com.myzubster.activities.PaymentActivity

class NotificationService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // TODO: inviare token al backend quando sarà disponibile l'endpoint utente/device.
        android.util.Log.d(TAG, "FCM token aggiornato: $token")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title
            ?: message.data["title"]
            ?: "MyZubster"
        val body = message.notification?.body
            ?: message.data["body"]
            ?: "Hai una nuova notifica"
        val paymentId = message.data["paymentId"]

        showNotification(title, body, paymentId)
    }

    private fun showNotification(title: String, body: String, paymentId: String?) {
        createNotificationChannel()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            android.util.Log.w(TAG, "Permesso POST_NOTIFICATIONS non concesso; notifica non mostrata")
            return
        }

        val intent = Intent(this, PaymentActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            paymentId?.let { putExtra(PaymentActivity.EXTRA_PAYMENT_ID, it) }
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            paymentId?.hashCode() ?: System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        NotificationManagerCompat.from(this).notify(paymentId?.hashCode() ?: 1001, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Pagamenti MyZubster",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Notifiche per pagamenti Monero e aggiornamenti MyZubster"
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    companion object {
        private const val TAG = "NotificationService"
        private const val CHANNEL_ID = "myzubster_payments"
    }
}
