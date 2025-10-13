const express = require("express")
const { handleStripeWebhook, handleStats, handleLogs, handleEvents, handlewebRetry, handleDelete, handleClearLogs } = require("../controllers/WebhooksController")

const webRoutes = express.Router()

// Public
webRoutes.post("/stripe ", handleStripeWebhook)
webRoutes.get("/events", handleEvents)

//PRIVATE === ADMIN
webRoutes.get("/stats", handleStats)
webRoutes.get("/logs", handleLogs)
webRoutes.post("/retry/:webhookId", handlewebRetry)
webRoutes.delete("/logs/:webhookId", handleDelete)
webRoutes.post("/clear-logs", handleClearLogs)



module.exports = webRoutes