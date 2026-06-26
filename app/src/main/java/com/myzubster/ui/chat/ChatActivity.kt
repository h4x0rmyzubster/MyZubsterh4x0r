package com.myzubster.ui.chat

import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.commit
import com.myzubster.R
import com.myzubster.fragments.PaymentFragment

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
        supportFragmentManager.commit {
            replace(
                R.id.chatFragmentContainer,
                PaymentFragment.newInstance(
                    amount = amountXmr.toDoubleOrNull() ?: 0.01,
                    sellerId = sellerId,
                    description = description
                )
            )
            addToBackStack("payment")
        }
    }

    companion object {
        const val EXTRA_CONTACT_USER_ID = "extra_contact_user_id"
    }
}
