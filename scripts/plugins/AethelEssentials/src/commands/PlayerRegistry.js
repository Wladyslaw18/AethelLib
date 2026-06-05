import { NickCommand }          from "./player/NickCommand.js";
import { RealNameCommand }      from "./player/RealNameCommand.js";
import { SeenCommand }          from "./player/SeenCommand.js";
import { PlaytimeCommand }      from "./player/PlaytimeCommand.js";

export const PlayerRegistry = {
    getCommands() {
        return [
            NickCommand,
            RealNameCommand,
            SeenCommand,
            PlaytimeCommand
        ];
    }
};
