const express = require("express");
const router = express.Router();
const { getHostelById } = require("../controllers/hostel.controller.js");

router.get("/:id", getHostelById);

module.exports = router;
