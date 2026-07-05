package com.myzubster.repositories

import com.myzubster.models.BookingHistoryResponse
import com.myzubster.network.ApiClient
import retrofit2.Response

class BookingHistoryRepository {
    
    private val apiService = ApiClient.getApiService()
    
    suspend fun getBookingHistory(
        userId: String,
        page: Int = 1,
        limit: Int = 10,
        category: String? = null,
        status: String? = null
    ): Response<BookingHistoryResponse> {
        return apiService.getBookingHistory(
            userId = userId,
            page = page,
            limit = limit,
            category = category,
            status = status
        )
    }
}