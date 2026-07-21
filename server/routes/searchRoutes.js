const express = require("express");
const router = express.Router();
const { searchGigs, searchFreelancers } = require("../controllers/searchController");

router.get("/gigs", searchGigs);
router.get("/freelancers", searchFreelancers);

module.exports = router;
