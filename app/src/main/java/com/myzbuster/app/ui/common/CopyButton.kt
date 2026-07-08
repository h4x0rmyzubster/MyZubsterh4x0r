package com.myzbuster.app.ui.common

import android.content.Context
import android.util.AttributeSet
import android.widget.Button
import com.myzbuster.app.utils.ClipboardUtils

class CopyButton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : Button(context, attrs, defStyleAttr) {

    private var textToCopy: String = ""

    init {
        // Rimuovi gli attributi personalizzati e usa un approccio programmatico
        setOnClickListener {
            performCopy()
        }
    }

    private fun performCopy() {
        if (textToCopy.isNotEmpty()) {
            ClipboardUtils.copyToClipboard(
                context = context,
                text = textToCopy,
                label = "Testo copiato",
                successMessage = "📋 Copiato negli appunti!"
            )
        } else {
            // Prova a prendere il testo dal tag o dal testo visualizzato
            val tagText = tag as? String
            if (!tagText.isNullOrEmpty()) {
                ClipboardUtils.copyToClipboard(
                    context = context,
                    text = tagText,
                    label = "Testo copiato",
                    successMessage = "📋 Copiato negli appunti!"
                )
            } else if (text.isNotEmpty()) {
                ClipboardUtils.copyToClipboard(
                    context = context,
                    text = text.toString(),
                    label = "Testo copiato",
                    successMessage = "📋 Copiato negli appunti!"
                )
            }
        }
    }

    fun setCopyData(text: String) {
        textToCopy = text
    }
}