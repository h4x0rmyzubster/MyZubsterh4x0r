package com.myzubster.activities

import android.os.Bundle
import android.widget.Button
import android.widget.CalendarView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import com.myzubster.R
import com.myzubster.models.BookingRequest
import com.myzubster.network.ApiClient
import com.myzubster.utils.TokenManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class BookCalendarActivity : AppCompatActivity() {

    private lateinit var calendarView: CalendarView
    private lateinit var chipGroupTimeSlots: ChipGroup
    private lateinit var tvNoSlots: TextView
    private lateinit var tvError: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var etNotes: TextInputEditText
    private lateinit var btnBook: Button
    private lateinit var tvServiceTitle: TextView
    private lateinit var tvServicePrice: TextView
    private lateinit var tvProfessionalName: TextView

    private var selectedDate: String = ""
    private var selectedTimeSlot: String = ""
    private var professionalId: String = ""
    private var skillId: String = ""
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_book_calendar)

        // Inizializza view
        calendarView = findViewById(R.id.calendarView)
        chipGroupTimeSlots = findViewById(R.id.chipGroupTimeSlots)
        tvNoSlots = findViewById(R.id.tvNoSlots)
        tvError = findViewById(R.id.tvError)
        progressBar = findViewById(R.id.progressBar)
        etNotes = findViewById(R.id.etNotes)
        btnBook = findViewById(R.id.btnBook)
        tvServiceTitle = findViewById(R.id.tvServiceTitle)
        tvServicePrice = findViewById(R.id.tvServicePrice)
        tvProfessionalName = findViewById(R.id.tvProfessionalName)

        // Ricevi dati
        professionalId = intent.getStringExtra("professionalId") ?: ""
        skillId = intent.getStringExtra("skillId") ?: ""
        val serviceTitle = intent.getStringExtra("serviceTitle") ?: "Servizio"
        val servicePrice = intent.getDoubleExtra("servicePrice", 0.0)
        val professionalName = intent.getStringExtra("professionalName") ?: "Professionista"

        tvServiceTitle.text = serviceTitle
        tvServicePrice.text = "Prezzo: ${servicePrice} XMR"
        tvProfessionalName.text = "Professionista: $professionalName"

        // Data di default = oggi
        val today = Date()
        selectedDate = dateFormat.format(today)

        // Calendario - selezione data
        calendarView.setOnDateChangeListener { _, year, month, dayOfMonth ->
            val calendar = Calendar.getInstance()
            calendar.set(year, month, dayOfMonth)
            selectedDate = dateFormat.format(calendar.time)
            loadAvailableSlots()
        }

        // Carica gli slot per oggi
        loadAvailableSlots()

        // Pulsante prenota
        btnBook.setOnClickListener {
            createBooking()
        }

        // Back button
        findViewById<com.google.android.material.appbar.MaterialToolbar>(R.id.toolbar)
            .setNavigationOnClickListener { onBackPressed() }
    }

    private fun loadAvailableSlots() {
        if (professionalId.isEmpty()) {
            tvError.text = "ID professionista non valido"
            tvError.visibility = android.view.View.VISIBLE
            return
        }

        progressBar.visibility = android.view.View.VISIBLE
        tvError.visibility = android.view.View.GONE
        chipGroupTimeSlots.removeAllViews()
        tvNoSlots.visibility = android.view.View.GONE

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getAvailableSlots(professionalId, selectedDate)
                if (response.success && response.data != null) {
                    val slots = response.data.availableSlots
                    if (slots.isNotEmpty()) {
                        slots.forEach { slot ->
                            val chip = Chip(this@BookCalendarActivity).apply {
                                text = slot
                                isClickable = true
                                setOnClickListener {
                                    selectedTimeSlot = slot
                                    chipGroupTimeSlots.check(id)
                                }
                            }
                            chipGroupTimeSlots.addView(chip)
                        }
                    } else {
                        tvNoSlots.visibility = android.view.View.VISIBLE
                    }
                } else {
                    tvError.text = response.error ?: "Errore nel caricamento degli orari"
                    tvError.visibility = android.view.View.VISIBLE
                }
            } catch (e: Exception) {
                tvError.text = "Errore di connessione: ${e.message}"
                tvError.visibility = android.view.View.VISIBLE
            } finally {
                progressBar.visibility = android.view.View.GONE
            }
        }
    }

    private fun createBooking() {
        if (selectedTimeSlot.isEmpty()) {
            Toast.makeText(this, "Seleziona un orario", Toast.LENGTH_SHORT).show()
            return
        }

        progressBar.visibility = android.view.View.VISIBLE
        btnBook.isEnabled = false

        val notes = etNotes.text.toString().trim()
        val tokenManager = TokenManager(this)
        val userId = tokenManager.getUserId() ?: "test-user-123"

        val request = BookingRequest(
            skillId = skillId,
            date = selectedDate,
            timeSlot = selectedTimeSlot,
            notes = notes
        )

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.createBooking(request)
                if (response.success) {
                    Toast.makeText(
                        this@BookCalendarActivity,
                        "Prenotazione creata con successo!",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                } else {
                    tvError.text = response.error ?: "Errore nella prenotazione"
                    tvError.visibility = android.view.View.VISIBLE
                }
            } catch (e: Exception) {
                tvError.text = "Errore: ${e.message}"
                tvError.visibility = android.view.View.VISIBLE
            } finally {
                progressBar.visibility = android.view.View.GONE
                btnBook.isEnabled = true
            }
        }
    }
}