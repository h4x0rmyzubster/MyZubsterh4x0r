package com.myzubster.ui.chat

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.myzubster.R
import com.myzubster.activities.PaymentActivity

class ChatActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chat)

        val contactUserId = intent.getStringExtra(EXTRA_CONTACT_USER_ID) ?: "seller-demo"
        title = "Chat con $contactUserId"

        findViewById<Button>(R.id.requestPaymentButton).setOnClickListener {
            requestPayment(amountXmr = "0.01", description = "Pagamento servizio MyZubster", sellerId = contactUserId)
        }
    }

    private fun requestPayment(amountXmr: String, description: String, sellerId: String) {
        val intent = Intent(this, PaymentActivity::class.java).apply {
            putExtra(PaymentActivity.EXTRA_AMOUNT, amountXmr.toDoubleOrNull() ?: 0.01)
            putExtra(PaymentActivity.EXTRA_SELLER_ID, sellerId)
            putExtra(PaymentActivity.EXTRA_DESCRIPTION, description)
        }
        startActivity(intent)
        overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
    }

    companion object {
        const val EXTRA_CONTACT_USER_ID = "extra_contact_user_id"
    }
}
