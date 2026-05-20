// ----------------------------------------------------------------------------
// | object: EconomyBridge                                                     |
// | Wraps the cross-plugin API mesh reference to core economy endpoints.     |
// ----------------------------------------------------------------------------
let apiInstance = null;

export const EconomyBridge = {
    // ----------------------------------------------------------------------------
    // | method: bind                                                             |
    // | Inject API from the service mesh on enable.                              |
    // ----------------------------------------------------------------------------
    bind(api) {
        apiInstance = api;
    },

    // ----------------------------------------------------------------------------
    // | method: taxPlayer / rewardPlayer / getBalance                            |
    // | Wraps async transitions with safety checks.                              |
    // ----------------------------------------------------------------------------
    async taxPlayer(player, amount) {
        if (!apiInstance) return false;
        try {
            return await apiInstance.taxPlayer(player, amount);
        } catch (error) {
            console.error(`[BountyHunter:EconomyBridge] taxPlayer error: ${error}`);
            return false;
        }
    },

    async rewardPlayer(player, amount) {
        if (!apiInstance) return false;
        try {
            return await apiInstance.rewardPlayer(player, amount);
        } catch (error) {
            console.error(`[BountyHunter:EconomyBridge] rewardPlayer error: ${error}`);
            return false;
        }
    },

    getBalance(player) {
        if (!apiInstance) return 0;
        try {
            return apiInstance.getBalance(player);
        } catch (error) {
            console.error(`[BountyHunter:EconomyBridge] getBalance error: ${error}`);
            return 0;
        }
    }
};
