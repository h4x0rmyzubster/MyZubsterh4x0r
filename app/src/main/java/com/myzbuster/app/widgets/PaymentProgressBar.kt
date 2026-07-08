package com.myzbuster.app.widgets

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.view.animation.DecelerateInterpolator

class PaymentProgressBar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val backgroundColor = Color.parseColor("#E0E0E0")
    private var progressColor = Color.parseColor("#4CAF50")

    private var currentProgress = 0f
    private var targetProgress = 0f
    private var progressAnimator: ValueAnimator? = null

    private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = backgroundColor
        style = Paint.Style.FILL
    }

    private val progressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = progressColor
    }

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 14f * resources.displayMetrics.density
        textAlign = Paint.Align.CENTER
        typeface = Typeface.DEFAULT_BOLD
    }

    // Rimuovi il blocco init che legge gli attributi personalizzati

    fun setProgress(progress: Int, animate: Boolean = true) {
        targetProgress = progress.toFloat().coerceIn(0f, 100f)
        if (animate) {
            animateProgress()
        } else {
            currentProgress = targetProgress
            invalidate()
        }
    }

    fun setColor(color: Int) {
        progressColor = color
        progressPaint.color = color
        invalidate()
    }

    private fun animateProgress() {
        progressAnimator?.cancel()
        progressAnimator = ValueAnimator.ofFloat(currentProgress, targetProgress).apply {
            duration = 800
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                currentProgress = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val width = width.toFloat()
        val height = height.toFloat()
        val cornerRadius = height / 2

        // Sfondo
        val bgRect = RectF(0f, 0f, width, height)
        canvas.drawRoundRect(bgRect, cornerRadius, cornerRadius, backgroundPaint)

        // Progresso
        val progressWidth = (width * (currentProgress / 100f)).coerceAtLeast(0f)
        if (progressWidth > 0) {
            val progressRect = RectF(0f, 0f, progressWidth, height)
            canvas.drawRoundRect(progressRect, cornerRadius, cornerRadius, progressPaint)
        }

        // Percentuale
        val text = "${currentProgress.toInt()}%"
        val x = width / 2
        val y = height / 2 - (textPaint.descent() + textPaint.ascent()) / 2
        canvas.drawText(text, x, y, textPaint)
    }
}