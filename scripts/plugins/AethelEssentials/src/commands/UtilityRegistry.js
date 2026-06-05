import { SpeedCommand }    from "./utility/SpeedCommand.js";
import { KickAllCommand }  from "./utility/KickAllCommand.js";
import { SaveAllCommand }  from "./utility/SaveAllCommand.js";
import { LagCommand }      from "./utility/LagCommand.js";
import { MemoryCommand }   from "./utility/MemoryCommand.js";
import { KillAllCommand }  from "./utility/KillAllCommand.js";
import { ButcherCommand }  from "./utility/ButcherCommand.js";
import { PluginsCommand }  from "./utility/PluginsCommand.js";

export const UtilityRegistry = {
    getCommands() {
        return [
            SpeedCommand,
            KickAllCommand,
            SaveAllCommand,
            LagCommand,
            MemoryCommand,
            KillAllCommand,
            ButcherCommand,
            PluginsCommand
        ];
    }
};
