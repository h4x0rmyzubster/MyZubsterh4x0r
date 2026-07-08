package com.myzbuster.app.ui.common

import android.content.Context
import android.util.AttributeSet
import android.widget.Toast
import androidx.appcompat.widget.AppCompatTextView
import com.myzbuster.app.utils.ClipboardUtils

class CopyableTextView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatTextView(context, attrs, defStyleAttr) {

    init {
        // Abilita la copia al tocco
        setOnClickListener {
            copyText()
        }
    }

    private fun copyText() {
        val textToCopy = text.toString()
        if (textToCopy.isNotEmpty()) {
            ClipboardUtils.copyToClipboard(
                context = context,
                text = textToCopy,
                label = "Testo copiato",
                successMessage = "📋 Copiato negli appunti!"
            )
        } else {
            Toast.makeText(context, "Nessun testo da copiare", Toast.LENGTH_SHORT).show()
        }
    }
}