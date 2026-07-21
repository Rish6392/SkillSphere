/**
 * AI-Powered Job Matching Engine
 * 
 * Calculates match scores between freelancers and gigs
 * based on skill similarity, location proximity, rating, and availability.
 */

/**
 * Calculate skill similarity score between two skill sets
 * @param {Array} freelancerSkills - Array of { name, proficiency }
 * @param {Array} gigSkills - Array of skill name strings
 * @returns {number} Score between 0 and 1
 */
const calculateSkillSimilarity = (freelancerSkills, gigSkills) => {
  if (!freelancerSkills?.length || !gigSkills?.length) return 0;

  const freelancerSkillNames = freelancerSkills.map((s) =>
    s.name.toLowerCase().trim()
  );
  const gigSkillNames = gigSkills.map((s) => s.toLowerCase().trim());

  let matchCount = 0;
  let proficiencyBonus = 0;

  gigSkillNames.forEach((gigSkill) => {
    const matchIndex = freelancerSkillNames.findIndex(
      (fs) => fs === gigSkill || fs.includes(gigSkill) || gigSkill.includes(fs)
    );

    if (matchIndex !== -1) {
      matchCount++;
      // Proficiency bonus
      const proficiency = freelancerSkills[matchIndex].proficiency;
      const proficiencyMap = {
        beginner: 0.25,
        intermediate: 0.5,
        advanced: 0.75,
        expert: 1.0,
      };
      proficiencyBonus += proficiencyMap[proficiency] || 0.5;
    }
  });

  const matchRatio = matchCount / gigSkillNames.length;
  const avgProficiency = matchCount > 0 ? proficiencyBonus / matchCount : 0;

  // Weighted: 70% match ratio + 30% proficiency
  return matchRatio * 0.7 + avgProficiency * 0.3;
};

/**
 * Calculate match score for a freelancer against a gig
 * @param {Object} freelancer - Freelancer profile with user data
 * @param {Object} gig - Gig document
 * @returns {Object} { score, breakdown }
 */
const calculateMatchScore = (freelancer, gig) => {
  const breakdown = {};

  // 1. Skill similarity (40% weight)
  breakdown.skillScore = calculateSkillSimilarity(
    freelancer.skills,
    gig.skills
  );

  // 2. Rating/Reputation score (25% weight)
  breakdown.ratingScore = (freelancer.reputationScore || 0) / 5;

  // 3. Experience score (20% weight)
  const completedJobs = freelancer.completedJobs || 0;
  breakdown.experienceScore = Math.min(completedJobs / 50, 1); // Max out at 50 jobs

  // 4. Availability score (15% weight)
  breakdown.availabilityScore =
    freelancer.availability?.status === "available"
      ? 1
      : freelancer.availability?.status === "partially_available"
      ? 0.5
      : 0;

  // Calculate weighted total
  const totalScore =
    breakdown.skillScore * 0.4 +
    breakdown.ratingScore * 0.25 +
    breakdown.experienceScore * 0.2 +
    breakdown.availabilityScore * 0.15;

  return {
    score: Math.round(totalScore * 100), // 0-100
    breakdown,
  };
};

/**
 * Get top matching freelancers for a gig
 * @param {Object} gig - Gig document
 * @param {Array} freelancers - Array of freelancer profiles
 * @param {number} limit - Number of results to return
 * @returns {Array} Sorted array of { freelancer, matchScore, breakdown }
 */
const getTopMatches = (gig, freelancers, limit = 10) => {
  const matches = freelancers.map((freelancer) => {
    const { score, breakdown } = calculateMatchScore(freelancer, gig);
    return { freelancer, matchScore: score, breakdown };
  });

  // Sort by match score (descending)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches.slice(0, limit);
};

module.exports = {
  calculateSkillSimilarity,
  calculateMatchScore,
  getTopMatches,
};
