package com.myzubster

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.myzubster.activities.BookingHistoryActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnTest = findViewById<Button>(R.id.btnTest)
        val btnBookingHistory = findViewById<Button>(R.id.btnBookingHistory)
        val btnSettings = findViewById<Button>(R.id.btnSettings)

        btnTest.setOnClickListener {
            Toast.makeText(this, "✅ App funzionante!", Toast.LENGTH_SHORT).show()
        }

        btnBookingHistory.setOnClickListener {
            val userId = getUserIdFromPreferences()
            if (userId.isNotEmpty()) {
                val intent = Intent(this, BookingHistoryActivity::class.java)
                intent.putExtra("userId", userId)
                startActivity(intent)
            } else {
                Toast.makeText(this, "⚠️ Usa ID di test", Toast.LENGTH_SHORT).show()
                // Usa ID di test
                val intent = Intent(this, BookingHistoryActivity::class.java)
                intent.putExtra("userId", "65f1a2b3c4d5e6f7g8h9i0j1")
                startActivity(intent)
            }
        }

        btnSettings.setOnClickListener {
            Toast.makeText(this, "⚙️ Impostazioni", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getUserIdFromPreferences(): String {
        val prefs = getSharedPreferences("MyZubsterPrefs", MODE_PRIVATE)
        return prefs.getString("userId", "") ?: ""
    }
}