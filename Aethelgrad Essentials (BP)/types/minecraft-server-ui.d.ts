/**
 * Minecraft Server UI API Type Definitions
 * Placeholder for UI types
 */

declare module "@minecraft/server-ui" {
    // Placeholder for UI types - will be expanded when needed
    export interface ActionFormData {
        title(text: string): ActionFormData
        body(text: string): ActionFormData
        button(text: string, icon?: string): ActionFormData
        show(player: any): Promise<any>
    }

    export interface ModalFormData {
        title(text: string): ModalFormData
        textField(label: string, placeholder?: string): ModalFormData
        dropdown(label: string, options: string[], defaultValue?: number): ModalFormData
        slider(label: string, minimum: number, maximum: number, step?: number, defaultValue?: number): ModalFormData
        toggle(label: string, defaultValue?: boolean): ModalFormData
        show(player: any): Promise<any>
    }

    export interface MessageFormData {
        title(text: string): MessageFormData
        body(text: string): MessageFormData
        button1(text: string): MessageFormData
        button2(text: string): MessageFormData
        show(player: any): Promise<any>
    }

    export const ActionFormData: {
        new(): ActionFormData
    }

    export const ModalFormData: {
        new(): ModalFormData
    }

    export const MessageFormData: {
        new(): MessageFormData
    }
}
