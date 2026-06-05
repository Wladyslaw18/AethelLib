import { WarnCommand }          from "./moderation/WarnCommand.js";
import { WarningsCommand }      from "./moderation/WarningsCommand.js";
import { ClearWarningsCommand } from "./moderation/ClearWarningsCommand.js";
import { SocialSpyCommand }     from "./moderation/SocialSpyCommand.js";
import { VanishCommand }        from "./moderation/VanishCommand.js";
import { SetJailCommand }       from "./moderation/SetJailCommand.js";
import { JailCommand }          from "./moderation/JailCommand.js";
import { UnjailCommand }        from "./moderation/UnjailCommand.js";
import { FreezeCommand }        from "./moderation/FreezeCommand.js";

export const ModerationRegistry = {
    getCommands() {
        return [
            WarnCommand,
            WarningsCommand,
            ClearWarningsCommand,
            SocialSpyCommand,
            VanishCommand,
            SetJailCommand,
            JailCommand,
            UnjailCommand,
            FreezeCommand
        ];
    }
};
