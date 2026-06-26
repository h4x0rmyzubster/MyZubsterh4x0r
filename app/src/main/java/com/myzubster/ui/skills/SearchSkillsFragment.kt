package com.myzubster.ui.skills

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.myzubster.R
import com.myzubster.activities.SkillDetailActivity
import com.myzubster.adapters.SkillAdapter
import com.myzubster.models.Skill
import com.myzubster.models.SkillUser

class SearchSkillsFragment : Fragment() {
    private lateinit var skillAdapter: SkillAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_search_skills, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        skillAdapter = SkillAdapter(onSkillClick = { skill -> openSkillDetail(skill.id) })

        view.findViewById<RecyclerView>(R.id.skillsRecyclerView).apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = skillAdapter
        }

        skillAdapter.submitList(sampleResults())
    }

    private fun openSkillDetail(skillId: String) {
        val intent = Intent(requireContext(), SkillDetailActivity::class.java).apply {
            putExtra(SkillDetailActivity.EXTRA_SKILL_ID, skillId)
        }
        startActivity(intent)
    }

    private fun sampleResults(): List<Skill> = listOf(
        Skill(
            id = "1",
            title = "Riparazioni rapide",
            category = "Casa",
            type = "Offerta",
            description = "Piccole riparazioni domestiche nel quartiere.",
            priceXmr = 0.02,
            distanceKm = 1.4,
            address = "Via Roma 10",
            user = SkillUser(id = "seller-1", name = "Marco")
        ),
        Skill(
            id = "2",
            title = "Aiuto compiti",
            category = "Studio",
            type = "Offerta",
            description = "Supporto matematica e inglese.",
            priceXmr = null,
            distanceKm = 0.8,
            address = "Piazza Verdi",
            user = SkillUser(id = "seller-2", name = "Giulia")
        )
    )
}
