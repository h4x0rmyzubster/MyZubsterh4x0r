package com.myzubster.models

data class BookingHistoryResponse(
    val success: Boolean,
    val data: List<BookingHistory>,
    val pagination: Pagination,
    val error: String? = null
)