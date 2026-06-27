package com.myzubster.activities

import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.myzubster.R
import com.myzubster.models.Payment
import com.myzubster.models.PaymentCreateRequest
import com.myzubster.models.PaymentStatus
import com.google.firebase.messaging.FirebaseMessaging
import com.myzubster.network.PaymentApiService
import com.myzubster.utils.QRCodeGenerator
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.coroutines.resume
import java.math.BigDecimal

class PaymentActivity : AppCompatActivity() {
    private val paymentApiService: PaymentApiService by lazy { PaymentApiService() }
    private var currentPayment: Payment? = null
    private var pollingJob: Job? = null
    private var successDialogShown = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_payment)
        overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)

        val existingPaymentId = intent.getStringExtra(EXTRA_PAYMENT_ID)
        val amount = intent.getDoubleExtra(EXTRA_AMOUNT, 0.01)
        val sellerId = intent.getStringExtra(EXTRA_SELLER_ID) ?: "seller-demo"
        val description = intent.getStringExtra(EXTRA_DESCRIPTION) ?: "Pagamento MyZubster"

        findViewById<TextView>(R.id.paymentActivityAmountText).text = "${formatAmount(amount)} XMR"
        findViewById<Button>(R.id.paymentActivityCancelButton).setOnClickListener { cancelPayment() }
        findViewById<Button>(R.id.paymentActivityOpenWalletButton).setOnClickListener { openWallet() }

        if (existingPaymentId.isNullOrBlank()) {
            createPayment(amount, description, sellerId)
        } else {
            setLoading(true)
            setStatus("Carico stato pagamento...")
            startStatusPolling(existingPaymentId)
        }
    }

    override fun onDestroy() {
        pollingJob?.cancel()
        pollingJob = null
        super.onDestroy()
    }

    private fun createPayment(amount: Double, description: String, sellerId: String) {
        setLoading(true)
        setStatus("Creo richiesta di pagamento...")

        lifecycleScope.launch {
            val fcmToken = runCatching { awaitFcmToken() }.getOrNull()
            runCatching {
                paymentApiService.createPayment(
                    PaymentCreateRequest(
                        amount = amount,
                        description = description,
                        sellerId = sellerId,
                        fcmToken = fcmToken
                    )
                )
            }.onSuccess { payment ->
                currentPayment = payment
                renderPayment(payment)
                startStatusPolling(payment.paymentId)
            }.onFailure { error ->
                setLoading(false)
                setStatus("Errore creazione pagamento: ${error.message}")
            }
        }
    }

    private fun startStatusPolling(paymentId: String) {
        pollingJob?.cancel()
        pollingJob = lifecycleScope.launch {
            while (isActive) {
                delay(POLL_INTERVAL_MS)
                runCatching { paymentApiService.checkPaymentStatus(paymentId) }
                    .onSuccess { payment ->
                        currentPayment = payment
                        renderPayment(payment)
                        if (payment.status == PaymentStatus.CONFIRMED) {
                            setLoading(false)
                            showSuccessDialog()
                            break
                        }
                        if (payment.status == PaymentStatus.FAILED) {
                            setLoading(false)
                            setStatus("Pagamento fallito")
                            break
                        }
                    }
                    .onFailure { error ->
                        setStatus("Errore verifica pagamento: ${error.message}")
                    }
            }
        }
    }

    private fun renderPayment(payment: Payment) {
        findViewById<TextView>(R.id.paymentActivityAmountText).text = "${payment.amountXmr} XMR"
        findViewById<TextView>(R.id.paymentActivityAddressText).text = payment.moneroAddress ?: payment.address
        findViewById<ImageView>(R.id.paymentActivityQrImage).setImageBitmap(
            QRCodeGenerator.generateMoneroQR(payment.moneroAddress ?: payment.address, payment.amountXmr.toDoubleOrNull() ?: payment.amount ?: 0.0)
        )
        findViewById<Button>(R.id.paymentActivityOpenWalletButton).isEnabled = !payment.uri.isNullOrBlank()
        setLoading(payment.status == PaymentStatus.PENDING)
        setStatus(readableStatus(payment))
    }

    private fun readableStatus(payment: Payment): String = when (payment.status) {
        PaymentStatus.CONFIRMED -> "Pagamento ricevuto (${payment.confirmations}/${payment.requiredConfirmations} conferme)"
        PaymentStatus.FAILED -> "Pagamento fallito"
        PaymentStatus.PENDING -> "In attesa del pagamento (${payment.confirmations}/${payment.requiredConfirmations} conferme)"
    }

    private fun openWallet() {
        val uri = currentPayment?.uri ?: return
        runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri))) }
            .onFailure { setStatus("Nessun wallet Monero disponibile") }
    }

    private fun cancelPayment() {
        pollingJob?.cancel()
        pollingJob = null
        setLoading(false)
        finish()
    }

    private suspend fun awaitFcmToken(): String? = kotlinx.coroutines.suspendCancellableCoroutine { continuation ->
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token -> continuation.resume(token) }
            .addOnFailureListener { continuation.resume(null) }
    }

    private fun showSuccessDialog() {
        if (successDialogShown) return
        successDialogShown = true
        AlertDialog.Builder(this)
            .setTitle("Pagamento ricevuto!")
            .setMessage("La transazione Monero è stata confermata.")
            .setPositiveButton(android.R.string.ok, null)
            .show()
    }

    private fun setLoading(loading: Boolean) {
        findViewById<ProgressBar>(R.id.paymentActivityProgress).visibility = if (loading) View.VISIBLE else View.GONE
        findViewById<Button>(R.id.paymentActivityCancelButton).isEnabled = true
        findViewById<Button>(R.id.paymentActivityOpenWalletButton).alpha = if (loading) 0.6f else 1.0f
    }

    private fun setStatus(message: String) {
        findViewById<TextView>(R.id.paymentActivityStatusText).text = message
    }

    private fun formatAmount(amount: Double): String = BigDecimal.valueOf(amount)
        .stripTrailingZeros()
        .toPlainString()

    override fun finish() {
        super.finish()
        overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
    }

    companion object {
        const val EXTRA_AMOUNT = "extra_amount"
        const val EXTRA_SELLER_ID = "extra_seller_id"
        const val EXTRA_DESCRIPTION = "extra_description"
        const val EXTRA_PAYMENT_ID = "extra_payment_id"
        private const val POLL_INTERVAL_MS = 5_000L
    }
}
