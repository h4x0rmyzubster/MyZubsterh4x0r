package com.myzubster.activities

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.myzubster.R
import com.myzubster.adapters.BookingHistoryAdapter
import com.myzubster.models.BookingHistory
import com.myzubster.network.ApiClient
import kotlinx.coroutines.*

class BookingHistoryActivity : AppCompatActivity() {

    private lateinit var toolbar: Toolbar
    private lateinit var recyclerView: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvError: TextView
    private lateinit var tvEmpty: TextView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout

    private lateinit var adapter: BookingHistoryAdapter
    private var bookings = mutableListOf<BookingHistory>()
    private var isLoading = false
    private var currentPage = 1
    private var hasMoreData = true
    private var userId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_booking_history)

        // Inizializza le view
        toolbar = findViewById(R.id.toolbar)
        recyclerView = findViewById(R.id.recyclerView)
        progressBar = findViewById(R.id.progressBar)
        tvError = findViewById(R.id.tv_error)
        tvEmpty = findViewById(R.id.tv_empty)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

        userId = intent.getStringExtra("userId") ?: getUserIdFromPreferences()

        setupToolbar()
        setupRecyclerView()
        setupSwipeRefresh()
        loadBookings(userId, currentPage)
    }

    private fun setupToolbar() {
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Storico Prenotazioni"
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }
    }

    private fun setupRecyclerView() {
        adapter = BookingHistoryAdapter { booking ->
            Toast.makeText(this, "Booking: ${booking.skillTitle}", Toast.LENGTH_SHORT).show()
        }
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        recyclerView.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                super.onScrolled(recyclerView, dx, dy)
                val layoutManager = recyclerView.layoutManager as LinearLayoutManager
                val visibleItemCount = layoutManager.childCount
                val totalItemCount = layoutManager.itemCount
                val firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition()

                if (!isLoading && hasMoreData && dy > 0) {
                    if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount
                        && firstVisibleItemPosition >= 0
                    ) {
                        loadBookings(userId, currentPage + 1)
                    }
                }
            }
        })
    }

    private fun setupSwipeRefresh() {
        swipeRefreshLayout.setOnRefreshListener {
            refreshBookings()
        }
        swipeRefreshLayout.setColorSchemeResources(
            android.R.color.holo_blue_bright,
            android.R.color.holo_green_light,
            android.R.color.holo_orange_light,
            android.R.color.holo_red_light
        )
    }

    private fun loadBookings(userId: String, page: Int) {
        if (isLoading) return
        isLoading = true
        progressBar.visibility = View.VISIBLE
        tvError.visibility = View.GONE

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = ApiClient.getApiService()
                val response = apiService.getBookingHistory(
                    userId = userId,
                    page = page,
                    limit = 10
                )

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body()?.success == true) {
                        val body = response.body()
                        body?.let {
                            if (page == 1) {
                                bookings.clear()
                            }
                            val newBookings = it.data
                            bookings.addAll(newBookings)
                            adapter.notifyDataSetChanged()

                            hasMoreData = it.pagination.total > bookings.size
                            currentPage = it.pagination.page

                            if (bookings.isEmpty()) {
                                tvEmpty.visibility = View.VISIBLE
                                recyclerView.visibility = View.GONE
                            } else {
                                tvEmpty.visibility = View.GONE
                                recyclerView.visibility = View.VISIBLE
                            }
                        }
                    } else {
                        val errorMsg = response.body()?.error ?: "Errore durante il caricamento"
                        showError(errorMsg)
                    }

                    progressBar.visibility = View.GONE
                    swipeRefreshLayout.isRefreshing = false
                    isLoading = false
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    showError("Errore di connessione: ${e.message}")
                    progressBar.visibility = View.GONE
                    swipeRefreshLayout.isRefreshing = false
                    isLoading = false
                }
            }
        }
    }

    private fun refreshBookings() {
        currentPage = 1
        hasMoreData = true
        bookings.clear()
        loadBookings(userId, currentPage)
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun getUserIdFromPreferences(): String {
        val sharedPref = getSharedPreferences("MyZubsterPrefs", MODE_PRIVATE)
        return sharedPref.getString("userId", "") ?: ""
    }
}