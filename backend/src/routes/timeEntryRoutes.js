const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { addTimeEntry, getTaskTimeEntries } = require("../controllers/timeEntryController");

// Mounted at /tasks/:taskId/time-entries  (mergeParams gives :taskId)
const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/:fieldId", getTaskTimeEntries);
router.post("/:fieldId", addTimeEntry);

module.exports = router;
