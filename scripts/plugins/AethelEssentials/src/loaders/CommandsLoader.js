import { ModerationRegistry } from "../commands/ModerationRegistry.js";
import { PlayerRegistry }     from "../commands/PlayerRegistry.js";
import { WorldRegistry }      from "../commands/WorldRegistry.js";
import { UtilityRegistry }    from "../commands/UtilityRegistry.js";

export const CommandsLoader = {
    init(context) {
        try { ModerationRegistry.register(context); } catch(e) { context.error(`[ModerationRegistry] CRASH: ${e}`); }
        try { PlayerRegistry.register(context); }     catch(e) { context.error(`[PlayerRegistry] CRASH: ${e}`); }
        try { WorldRegistry.register(context); }      catch(e) { context.error(`[WorldRegistry] CRASH: ${e}`); }
        try { UtilityRegistry.register(context); }    catch(e) { context.error(`[UtilityRegistry] CRASH: ${e}`); }
        context.log("[CommandsLoader] All vectors registered.");
    }
};
