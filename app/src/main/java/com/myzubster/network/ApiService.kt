package com.myzubster.network

import com.myzubster.models.BookingHistoryResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("api/bookings/history/{userId}")
    suspend fun getBookingHistory(
        @Path("userId") userId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10,
        @Query("category") category: String? = null,
        @Query("status") status: String? = null
    ): Response<BookingHistoryResponse>
}