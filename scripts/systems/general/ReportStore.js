import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/**
 * ReportStore - Data Oriented access for player and server reports
 */
export const ReportStore = {
    /**
     * Get all reports
     * @returns {Object} Dictionary of reports
     */
    getReports() {
        try {
            const Database = Kernel.get("database")
            const stored = Database.get("ae:reports")
            return stored || {}
        } catch (error) {
            console.error(`[ReportStore] QUERY_FAILURE: ${error}`)
            return {}
        }
    },

    /**
     * Save a single report
     * @param {Object} report
     */
    saveReport(report) {
        const reports = this.getReports()
        reports[report.id] = report
        
        try {
            const Database = Kernel.get("database")
            Database.set("ae:reports", reports)
        } catch (error) {
            console.error(`[ReportStore] PERSISTENCE_FAILURE: ${error}`)
        }
    },

    /**
     * Delete a report
     * @param {string} reportId 
     */
    deleteReport(reportId) {
        try {
            const reports = this.getReports()
            delete reports[reportId]
            const Database = Kernel.get("database")
            Database.set("ae:reports", reports)
        } catch (error) {
            console.error(`[ReportStore] Failed to delete report: ${error}`)
        }
    }
}
