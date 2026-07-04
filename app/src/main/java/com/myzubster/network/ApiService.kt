package com.myzubster.network

import com.myzubster.BuildConfig
import com.myzubster.models.CreateReviewRequest
import com.myzubster.models.Review
import com.myzubster.models.Skill
import com.myzubster.models.EscrowRequest
import com.myzubster.models.EscrowResponse
import com.myzubster.models.BookingRequest
import com.myzubster.models.BookingResponse
import com.myzubster.models.BookingListResponse
import com.myzubster.models.AvailableSlotsResponse
import com.myzubster.services.EscrowListResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

data class ApiPaymentCreateRequest(
    val amount: Double,
    val description: String,
    val sellerId: String,
    val confirmations: Int = 0
)

data class PaymentApiResponse(
    val paymentId: String,
    val address: String,
    val amount: Double? = null,
    val amountXmr: String,
    val amountAtomic: String? = null,
    val description: String? = null,
    val sellerId: String? = null,
    val requiredConfirmations: Int = 0,
    val status: String,
    val paidXmr: String? = null,
    val paidAtomic: String? = null,
    val confirmations: Int = 0,
    val txIds: List<String> = emptyList(),
    val uri: String? = null
)

data class PaymentWebhookRequest(
    val paymentId: String,
    val amountAtomic: String? = null,
    val paidAtomic: String? = null,
    val confirmations: Int = 0,
    val txIds: List<String> = emptyList()
)

interface ApiService {

    // ============ SKILLS ============
    @GET("api/skills/{skillId}")
    suspend fun getSkillDetail(@Path("skillId") skillId: String): Skill

    // ============ REVIEWS ============
    @POST("api/reviews")
    suspend fun createReview(@Body request: CreateReviewRequest): Review

    @GET("api/reviews/user/{userId}")
    suspend fun getReviewsForUser(@Path("userId") userId: String): List<Review>

    @GET("api/reviews/skill/{skillId}")
    suspend fun getReviewsForSkill(@Path("skillId") skillId: String): List<Review>

    // ============ PAYMENTS ============
    @POST("api/payment/create")
    suspend fun createPayment(@Body request: ApiPaymentCreateRequest): PaymentApiResponse

    @GET("api/payment/status/{paymentId}")
    suspend fun getPaymentStatus(@Path("paymentId") paymentId: String): PaymentApiResponse

    @POST("api/payment/webhook")
    suspend fun updatePaymentFromWebhook(@Body request: PaymentWebhookRequest): PaymentApiResponse

    // ============ ESCROW ============
    @POST("/api/escrow/create")
    suspend fun createEscrow(@Body request: EscrowRequest): EscrowResponse

    @POST("/api/escrow/fund")
    suspend fun fundEscrow(@Body transactionId: Map<String, String>): EscrowResponse

    @POST("/api/escrow/release")
    suspend fun releaseEscrow(@Body transactionId: Map<String, String>): EscrowResponse

    @POST("/api/escrow/dispute")
    suspend fun disputeEscrow(@Body request: Map<String, String>): EscrowResponse

    @GET("/api/escrow/status/{transactionId}")
    suspend fun getEscrowStatus(@Path("transactionId") transactionId: String): EscrowResponse

    @GET("/api/escrow/user/{userId}")
    suspend fun getUserEscrows(@Path("userId") userId: String): EscrowListResponse

    // ============ BOOKINGS ============
    @POST("/api/bookings")
    suspend fun createBooking(@Body request: BookingRequest): BookingResponse

    @GET("/api/bookings/user/{userId}")
    suspend fun getUserBookings(
        @Path("userId") userId: String,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): BookingListResponse

    @GET("/api/bookings/available-slots")
    suspend fun getAvailableSlots(
        @Query("professionalId") professionalId: String,
        @Query("date") date: String
    ): AvailableSlotsResponse

    @PUT("/api/bookings/{id}/status")
    suspend fun updateBookingStatus(
        @Path("id") id: String,
        @Body status: Map<String, String>
    ): BookingResponse

    companion object {
        fun create(
            baseUrl: String = BuildConfig.API_BASE_URL,
            okHttpClient: OkHttpClient? = null
        ): ApiService {
            val client = okHttpClient ?: OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
                .build()

            return Retrofit.Builder()
                .baseUrl(baseUrl.trimEnd('/') + "/")
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
    }
}