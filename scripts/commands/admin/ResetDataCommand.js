import { Kernel } from "../../core/Kernel.js"
import { UIUtils } from "../../ui/UIUtils.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"

// ----------------------------------------------------------------------------
// | object: ResetDataCommand                                                 |
// | powerful administrative tool for wiping persistent data tiers.           |
// | supports granular resets (e.g. just homes) or total system purges.       |
// ----------------------------------------------------------------------------
export const ResetDataCommand = {
    // internal name.
    name: "resetdata",
    // human-readable description.
    description: "Reset server data and databases",
    // syntax guide.
    usage: "/ae:resetdata",
    // required permission level (high authority).
    permission: "essentials.admin.resetdata",
    // organization category.
    category: "Admin",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | launches the selection UI for the admin.                                 |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // list of available purge categories.
        const categories = [
            "ALL DATA", 
            "MONEY DATA", 
            "HOME DATA", 
            "WARP DATA", 
            "BAN DATA", 
            "SETTING DATA", 
            "SHOP DATA", 
            "SELL DATA", 
            "RANK DATA", 
            "FLOATINGTEXT DATA"
        ]

        // build the selection form.
        const form = new Kernel.ModalFormData()
            .title("\xA7c\xA7lRESET DATA")
            .dropdown("Choose data that you want to reset :", categories)

        // show the form and wait for a response.
        const res = await UIUtils.showForm(player, form)
        
        // handle cancellation.
        if (res.canceled) {
            return player.sendMessage("\xA7c\xA7l» \xA77Reset data canceled.")
        }

        // resolve the selected category string.
        const selection = categories[res.formValues[0]]
        // trigger the physical purge sequence.
        await this.performReset(player, selection)
    },

    // ----------------------------------------------------------------------------
    // | method: performReset                                                     |
    // | routing logic to the specific sub-system purge functions.                |
    // ----------------------------------------------------------------------------
    async performReset(player, category) {
        try {
            let successCount = 0
            let errorCount = 0

            // internal helper to run an async reset function and track its outcome.
            const runReset = async (fn) => {
                const success = await fn()
                if (success) successCount++
                else errorCount++
            }

            // switch board for the different data tiers.
            switch (category) {
                case "ALL DATA":
                    await runReset(resetMoney)
                    await runReset(resetHomes)
                    await runReset(resetWarps)
                    await runReset(resetBans)
                    await runReset(resetSellPrices)
                    await runReset(resetShop)
                    await runReset(resetRanks)
                    await runReset(resetFloatingText)
                    break

                case "MONEY DATA":
                    await runReset(resetMoney)
                    break

                case "HOME DATA":
                    await runReset(resetHomes)
                    break

                case "WARP DATA":
                    await runReset(resetWarps)
                    break

                case "BAN DATA":
                    await runReset(resetBans)
                    break

                case "SETTING DATA":
                    // direct interaction with the settings store to revert to defaults.
                    SettingsStore.updateAll(SettingsStore.DEFAULT_SETTINGS)
                    successCount++
                    break

                case "SHOP DATA":
                    await runReset(resetShop)
                    break

                case "SELL DATA":
                    await runReset(resetSellPrices)
                    break

                case "RANK DATA":
                    await runReset(resetRanks)
                    break

                case "FLOATINGTEXT DATA":
                    await runReset(resetFloatingText)
                    break
            }

            // notify the admin of the results.
            if (errorCount === 0) {
                player.sendMessage(`\xA7a\xA7l» \xA7fData for \xA7e${category}\xA7f has been reset.`);
            } else {
                player.sendMessage(`\xA7e\xA7l» \xA77Reset complete with some errors.`);
            }

        } catch (error) {
            // catch any catastrophic failures in the reset pipeline.
            player.sendMessage(`\xA7c\xA7l» \xA77Failed to reset data: ${error.message}`);
        }
    }
}

// ----------------------------------------------------------------------------
// | sub-system purge functions                                               |
// | specific logic for wiping each database key.                             |
// ----------------------------------------------------------------------------

async function resetMoney() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:economy_data")
        return true
    } catch (error) { return false }
}

async function resetHomes() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:homes_data")
        return true
    } catch (error) { return false }
}

async function resetWarps() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:warps")
        Database.delete("ae:warp:list")
        return true
    } catch (error) { return false }
}

async function resetBans() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:bans")
        return true
    } catch (error) { return false }
}

async function resetSellPrices() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:sell_prices")
        return true
    } catch (error) { return false }
}

async function resetShop() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:shop_data")
        Database.delete("ae:shop_items")
        return true
    } catch (error) { return false }
}

async function resetRanks() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:rank:list")
        return true
    } catch (error) { return false }
}

async function resetFloatingText() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:floatingtexts")
        return true
    } catch (error) { return false }
}
