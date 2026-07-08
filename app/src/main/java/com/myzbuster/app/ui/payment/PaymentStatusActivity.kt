package com.myzbuster.app.ui.payment

import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.myzbuster.app.R
import com.myzbuster.app.models.PaymentState
import com.myzbuster.app.models.PaymentStatus
import com.myzbuster.app.utils.PaymentStatusUtils
import com.myzbuster.app.widgets.PaymentProgressBar

class PaymentStatusActivity : AppCompatActivity() {

    private lateinit var progressBar: PaymentProgressBar
    private lateinit var statusText: TextView
    private lateinit var amountText: TextView
    private lateinit var statusDetailText: TextView
    private lateinit var retryButton: Button

    private var currentPayment: PaymentStatus? = null
    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_payment_status)

        initViews()
        loadPaymentData()
        startStatusSimulation()
    }

    private fun initViews() {
        progressBar = findViewById(R.id.payment_progress_bar)
        statusText = findViewById(R.id.payment_status_text)
        amountText = findViewById(R.id.payment_amount_text)
        statusDetailText = findViewById(R.id.payment_status_detail)
        retryButton = findViewById(R.id.payment_retry_button)

        retryButton.setOnClickListener {
            resetAndRetry()
        }
    }

    private fun loadPaymentData() {
        val bookingId = intent.getStringExtra("booking_id") ?: "default_booking"
        val amount = intent.getDoubleExtra("amount", 0.0)

        currentPayment = PaymentStatusUtils.getDefaultPaymentStatus(bookingId, amount)
        updateUI(currentPayment!!)
    }

    private fun startStatusSimulation() {
        val states = listOf(
            PaymentState.PROCESSING,
            PaymentState.PROCESSING,
            PaymentState.COMPLETED
        )

        var index = 0

        handler.post(object : Runnable {
            override fun run() {
                if (index < states.size && currentPayment != null) {
                    val newState = states[index]
                    currentPayment = PaymentStatusUtils.updatePaymentProgress(
                        currentPayment!!,
                        newState
                    )
                    updateUI(currentPayment!!)
                    index++
                    handler.postDelayed(this, 2000)
                }
            }
        })
    }

    private fun updateUI(payment: PaymentStatus) {
        // Usa un metodo helper per ottenere il colore
        val color = getColorForState(payment.status)

        progressBar.setColor(color)
        progressBar.setProgress(payment.progress)

        statusText.text = payment.getStatusMessage()
        statusText.setTextColor(color)
        amountText.text = "Importo: ${payment.amount} XMR"
        statusDetailText.text = "ID Transazione: ${payment.id}"

        retryButton.visibility = if (payment.isFailed()) {
            android.view.View.VISIBLE
        } else {
            android.view.View.GONE
        }
    }

    // Metodo helper per ottenere il colore
    private fun getColorForState(state: PaymentState): Int {
        return when (state) {
            PaymentState.PENDING -> Color.parseColor("#FF9800")
            PaymentState.PROCESSING -> Color.parseColor("#2196F3")
            PaymentState.COMPLETED -> Color.parseColor("#4CAF50")
            PaymentState.FAILED -> Color.parseColor("#F44336")
            PaymentState.CANCELLED -> Color.parseColor("#9E9E9E")
            PaymentState.REFUNDED -> Color.parseColor("#00BCD4")
        }
    }

    private fun resetAndRetry() {
        currentPayment = PaymentStatusUtils.updatePaymentProgress(
            currentPayment!!,
            PaymentState.PENDING
        )
        updateUI(currentPayment!!)
        startStatusSimulation()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }
}