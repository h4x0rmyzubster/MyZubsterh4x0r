package com.myzubster.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.myzubster.R
import com.myzubster.models.Skill
import com.myzubster.network.ApiService
import com.myzubster.ui.chat.ChatActivity
import kotlinx.coroutines.launch
import java.util.Locale

class SkillDetailActivity : AppCompatActivity() {
    private val apiService: ApiService by lazy { ApiService.create() }
    private var publisherUserId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_skill_detail)

        val skillId = intent.getStringExtra(EXTRA_SKILL_ID)
        if (skillId.isNullOrBlank()) {
            showError("ID competenza mancante")
            return
        }

        findViewById<Button>(R.id.contactSellerButton).setOnClickListener {
            openChatWithPublisher()
        }

        loadSkill(skillId)
    }

    private fun loadSkill(skillId: String) {
        setLoading(true)
        hideError()

        lifecycleScope.launch {
            runCatching { apiService.getSkillDetail(skillId) }
                .onSuccess { skill ->
                    setLoading(false)
                    bindSkill(skill)
                }
                .onFailure { error ->
                    setLoading(false)
                    showError(error.message ?: "Errore durante il caricamento della competenza")
                }
        }
    }

    private fun bindSkill(skill: Skill) {
        publisherUserId = skill.user.id

        findViewById<TextView>(R.id.skillDetailTitleText).text = skill.title
        findViewById<TextView>(R.id.skillDetailCategoryBadge).text = skill.category
        findViewById<TextView>(R.id.skillDetailTypeBadge).text = skill.type
        findViewById<TextView>(R.id.skillDetailDescriptionText).text = skill.description
        findViewById<TextView>(R.id.skillDetailPriceText).text = skill.priceXmr
            ?.let { "Prezzo: ${formatXmr(it)} XMR" }
            ?: "Prezzo: non indicato"
        findViewById<TextView>(R.id.skillDetailDistanceText).text = skill.distanceKm
            ?.let { "Distanza: ${String.format(Locale.US, "%.1f", it)} km" }
            ?: "Distanza: non disponibile"
        findViewById<TextView>(R.id.skillDetailAddressText).text = "Indirizzo: ${skill.address ?: "non disponibile"}"
        findViewById<TextView>(R.id.skillDetailUserNameText).text = skill.user.name
        findViewById<TextView>(R.id.skillDetailAvatarText).text = skill.user.name.firstOrNull()?.uppercaseChar()?.toString() ?: "👤"
        findViewById<Button>(R.id.contactSellerButton).isEnabled = skill.user.id.isNotBlank()
    }

    private fun openChatWithPublisher() {
        val userId = publisherUserId ?: return
        val intent = Intent(this, ChatActivity::class.java).apply {
            putExtra(ChatActivity.EXTRA_CONTACT_USER_ID, userId)
        }
        startActivity(intent)
    }

    private fun setLoading(loading: Boolean) {
        findViewById<ProgressBar>(R.id.skillDetailProgress).visibility = if (loading) View.VISIBLE else View.GONE
    }

    private fun showError(message: String) {
        findViewById<TextView>(R.id.skillDetailErrorText).apply {
            text = message
            visibility = View.VISIBLE
        }
        findViewById<Button>(R.id.contactSellerButton).isEnabled = false
    }

    private fun hideError() {
        findViewById<TextView>(R.id.skillDetailErrorText).visibility = View.GONE
    }

    private fun formatXmr(value: Double): String = String.format(Locale.US, "%.12f", value)
        .trimEnd('0')
        .trimEnd('.')

    companion object {
        const val EXTRA_SKILL_ID = "extra_skill_id"
    }
}
