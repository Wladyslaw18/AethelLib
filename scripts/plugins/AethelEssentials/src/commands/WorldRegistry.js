import { TimeCommand }    from "./world/TimeCommand.js";
import { WeatherCommand } from "./world/WeatherCommand.js";
import { XpCommand }      from "./world/XpCommand.js";
import { RepairCommand }  from "./world/RepairCommand.js";
import { EnchantCommand } from "./world/EnchantCommand.js";
import { GiveCommand }    from "./world/GiveCommand.js";
import { MoreCommand }    from "./world/MoreCommand.js";

export const WorldRegistry = {
    getCommands() {
        return [
            TimeCommand,
            WeatherCommand,
            XpCommand,
            RepairCommand,
            EnchantCommand,
            GiveCommand,
            MoreCommand
        ];
    }
};
