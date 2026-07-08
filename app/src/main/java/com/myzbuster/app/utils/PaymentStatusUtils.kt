package com.myzbuster.app.utils

import com.myzbuster.app.models.PaymentState
import com.myzbuster.app.models.PaymentStatus

object PaymentStatusUtils {
    
    fun getDefaultPaymentStatus(bookingId: String, amount: Double): PaymentStatus {
        return PaymentStatus(
            id = "payment_${System.currentTimeMillis()}",
            bookingId = bookingId,
            amount = amount,
            status = PaymentState.PENDING,
            progress = 0
        )
    }
    
    fun updatePaymentProgress(payment: PaymentStatus, newState: PaymentState): PaymentStatus {
        val progress = when (newState) {
            PaymentState.PENDING -> 0
            PaymentState.PROCESSING -> 50
            PaymentState.COMPLETED -> 100
            PaymentState.FAILED -> 0
            PaymentState.CANCELLED -> 0
            PaymentState.REFUNDED -> 100
        }
        
        return payment.copy(
            status = newState,
            progress = progress,
            updatedAt = System.currentTimeMillis()
        )
    }
    
    fun getProgressForState(state: PaymentState): Int {
        return when (state) {
            PaymentState.PENDING -> 0
            PaymentState.PROCESSING -> 50
            PaymentState.COMPLETED -> 100
            PaymentState.FAILED -> 0
            PaymentState.CANCELLED -> 0
            PaymentState.REFUNDED -> 100
        }
    }
}