package com.myzubster.models

import com.google.gson.annotations.SerializedName

data class Skill(
    val id: String,
    val title: String,
    val category: String,
    val type: String,
    val description: String,
    @SerializedName("priceXmr") val priceXmr: Double? = null,
    val distanceKm: Double? = null,
    val address: String? = null,
    val user: SkillUser,
    val sellerId: String = user.id
)

data class SkillUser(
    val id: String,
    val name: String,
    val avatarUrl: String? = null
)
