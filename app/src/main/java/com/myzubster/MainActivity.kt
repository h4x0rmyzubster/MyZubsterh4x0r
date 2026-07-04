package com.myzubster

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var tvTitle: TextView
    private lateinit var tvVersion: TextView
    private lateinit var btnTest: Button
    private lateinit var btnOpenSettings: Button
    private lateinit var btnExit: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Inizializza le view
        tvTitle = findViewById(R.id.tvTitle)
        tvVersion = findViewById(R.id.tvVersion)
        btnTest = findViewById(R.id.btnTest)
        btnOpenSettings = findViewById(R.id.btnOpenSettings)
        btnExit = findViewById(R.id.btnExit)

        // Imposta i testi
        tvTitle.text = "🧩 MyZubster"
        tvVersion.text = "Versione 0.3.0-beta (Beta 3)"

        // Listener per il pulsante Test
        btnTest.setOnClickListener {
            Toast.makeText(this, "✅ MyZubster funziona correttamente!", Toast.LENGTH_LONG).show()
        }

        // Listener per il pulsante Impostazioni
        btnOpenSettings.setOnClickListener {
            Toast.makeText(this, "⚙️ Impostazioni in arrivo!", Toast.LENGTH_SHORT).show()
        }

        // Listener per il pulsante Esci
        btnExit.setOnClickListener {
            finish()
        }
    }
}