import { ConfigService } from 'tabby-core'

export interface ButtonBarConfig {
    barVisible: boolean
    lists: unknown[]
    activeListId: string
    useCommandAsLabel: boolean
    commandLabelMaxLength: number
    defaultSendEnter: boolean
}

export const DEFAULT_BUTTON_BAR_CONFIG: ButtonBarConfig = {
    barVisible: true,
    lists: [],
    activeListId: '',
    useCommandAsLabel: true,
    commandLabelMaxLength: 20,
    defaultSendEnter: true,
}

/** Tabby ConfigProxy 的 pluginConfig 只有 getter，只能就地修改子字段 */
export function getButtonBarConfig(config: ConfigService): Record<string, unknown> {
    const root = config.store.pluginConfig as Record<string, unknown>
    if (!root['button-bar']) {
        root['button-bar'] = {}
    }
    return root['button-bar'] as Record<string, unknown>
}

export function getButtonBarConfigValue(config: ConfigService): ButtonBarConfig {
    return {
        ...DEFAULT_BUTTON_BAR_CONFIG,
        ...getButtonBarConfig(config),
    } as ButtonBarConfig
}
