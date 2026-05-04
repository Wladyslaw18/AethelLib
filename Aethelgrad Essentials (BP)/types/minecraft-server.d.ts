/**
 * Minecraft Server API Type Definitions
 * Minimal types for development - actual types available via @minecraft/server package
 */

declare module "@minecraft/server" {
    export interface Player {
        id: string
        name: string
        getTags(): string[]
        addTag(tag: string): boolean
        removeTag(tag: string): boolean
        getDynamicProperty(identifier: string): any
        setDynamicProperty(identifier: string, value?: any): void
        sendMessage(message: string): void
        dimension: Dimension
        location: Vector3
    }

    export interface Dimension {
        id: string
    }

    export interface Vector3 {
        x: number
        y: number
        z: number
    }

    export interface ChatSendBeforeEvent {
        sender: Player
        message: string
        cancel: boolean
    }

    export interface WorldInitializeAfterEvent {}

    export const world: {
        beforeEvents: {
            chatSend: {
                subscribe(callback: (event: ChatSendBeforeEvent) => void): void
            }
        }
        afterEvents: {
            worldInitialize: {
                subscribe(callback: (event: WorldInitializeAfterEvent) => void): void
            }
        }
        getDynamicProperty(identifier: string): any
        setDynamicProperty(identifier: string, value?: any): void
        getPlayers(): Player[]
    }

    export const system: {
        run(callback: () => void): void
    }
}

declare module "@minecraft/server-ui" {
    // Placeholder for UI types
}
