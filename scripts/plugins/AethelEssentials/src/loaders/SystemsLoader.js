import { WarningStore }   from "../systems/stores/WarningStore.js";
import { SocialSpyStore } from "../systems/stores/SocialSpyStore.js";
import { VanishStore }    from "../systems/stores/VanishStore.js";
import { JailStore }      from "../systems/stores/JailStore.js";
import { NicknameStore }  from "../systems/stores/NicknameStore.js";
import { SeenStore }      from "../systems/stores/SeenStore.js";
import { FreezeTracker }  from "../systems/stores/FreezeTracker.js";
import { BountyStore }    from "../systems/stores/BountyStore.js";

import { JailListener }   from "../systems/listeners/JailListener.js";
import { VanishListener } from "../systems/listeners/VanishListener.js";
import { SeenListener }   from "../systems/listeners/SeenListener.js";
import { BountyListener } from "../systems/listeners/BountyListener.js";

export const SystemsLoader = {
    init(context) {
        // --- CORE STATE (stores) ---
        WarningStore.init(context);
        SocialSpyStore.init(context);
        VanishStore.init(context);
        JailStore.init(context);
        NicknameStore.init(context);
        SeenStore.init(context);
        FreezeTracker.init(context);
        BountyStore.init(context);

        // --- EVENT BINDINGS (listeners) ---
        JailListener.init(context);
        VanishListener.init(context);
        SeenListener.init(context);
        BountyListener.init(context);

        context.log("[SystemsLoader] Stores and listeners online.");
    }
};
