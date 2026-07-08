package com.myzbuster.app.models

/**
 * Modello dati per lo stato di un pagamento
 */
data class PaymentStatus(
    val id: String,
    val bookingId: String,
    val amount: Double,
    val status: PaymentState,
    val progress: Int = 0, // 0-100
    val transactionHash: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val errorMessage: String? = null
) {
    fun isCompleted(): Boolean = status == PaymentState.COMPLETED
    fun isPending(): Boolean = status == PaymentState.PENDING
    fun isFailed(): Boolean = status == PaymentState.FAILED
    
    fun getStatusMessage(): String {
        return when (status) {
            PaymentState.PENDING -> "⏳ In attesa di conferma..."
            PaymentState.PROCESSING -> "🔄 Elaborazione in corso..."
            PaymentState.COMPLETED -> "✅ Pagamento completato!"
            PaymentState.FAILED -> "❌ Pagamento fallito"
            PaymentState.CANCELLED -> "⛔ Pagamento annullato"
            PaymentState.REFUNDED -> "🔄 Rimborso effettuato"
        }
    }
}

enum class PaymentState {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED,
    REFUNDED
}

fun PaymentState.getColor(): Int {
    return when (this) {
        PaymentState.PENDING -> android.graphics.Color.parseColor("#FF9800")
        PaymentState.PROCESSING -> android.graphics.Color.parseColor("#2196F3")
        PaymentState.COMPLETED -> android.graphics.Color.parseColor("#4CAF50")
        PaymentState.FAILED -> android.graphics.Color.parseColor("#F44336")
        PaymentState.CANCELLED -> android.graphics.Color.parseColor("#9E9E9E")
        PaymentState.REFUNDED -> android.graphics.Color.parseColor("#00BCD4")
    }
}