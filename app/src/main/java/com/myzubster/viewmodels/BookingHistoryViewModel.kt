package com.myzubster.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.myzubster.models.BookingHistory
import com.myzubster.repositories.BookingHistoryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BookingHistoryViewModel : ViewModel() {

    private val repository = BookingHistoryRepository()

    private val _bookingHistory = MutableStateFlow<List<BookingHistory>>(emptyList())
    val bookingHistory: StateFlow<List<BookingHistory>> = _bookingHistory.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _pagination = MutableStateFlow<PaginationState?>(null)
    val pagination: StateFlow<PaginationState?> = _pagination.asStateFlow()

    private var currentPage = 1
    private var totalPages = 0
    private var currentUserId: String? = null
    private var currentCategory: String? = null
    private var currentStatus: String? = null

    data class PaginationState(
        val currentPage: Int,
        val totalPages: Int,
        val totalItems: Int,
        val itemsPerPage: Int
    )

    fun loadBookingHistory(
        userId: String,
        category: String? = null,
        status: String? = null,
        page: Int = 1,
        limit: Int = 10
    ) {
        if (_isLoading.value) return

        currentUserId = userId
        currentCategory = category
        currentStatus = status
        currentPage = page

        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val response = repository.getBookingHistory(
                    userId = userId,
                    page = page,
                    limit = limit,
                    category = category,
                    status = status
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    val body = response.body()
                    body?.let {
                        _bookingHistory.value = it.data
                        totalPages = if (it.pagination.total % it.pagination.limit == 0) {
                            it.pagination.total / it.pagination.limit
                        } else {
                            it.pagination.total / it.pagination.limit + 1
                        }
                        _pagination.value = PaginationState(
                            currentPage = it.pagination.page,
                            totalPages = totalPages,
                            totalItems = it.pagination.total,
                            itemsPerPage = it.pagination.limit
                        )
                    }
                } else {
                    _error.value = response.body()?.error ?: "Error loading booking history"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Network error occurred"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadNextPage() {
        if (currentPage < totalPages && !_isLoading.value) {
            currentUserId?.let { userId ->
                loadBookingHistory(
                    userId = userId,
                    category = currentCategory,
                    status = currentStatus,
                    page = currentPage + 1
                )
            }
        }
    }

    fun loadPreviousPage() {
        if (currentPage > 1 && !_isLoading.value) {
            currentUserId?.let { userId ->
                loadBookingHistory(
                    userId = userId,
                    category = currentCategory,
                    status = currentStatus,
                    page = currentPage - 1
                )
            }
        }
    }

    fun filterByStatus(userId: String, status: String) {
        loadBookingHistory(userId, null, status, 1)
    }

    fun clearFilters(userId: String) {
        currentCategory = null
        currentStatus = null
        loadBookingHistory(userId, null, null, 1)
    }
}