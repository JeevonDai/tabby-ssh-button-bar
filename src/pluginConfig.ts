import { ConfigService } from 'tabby-core'

/** Tabby ConfigProxy 的 pluginConfig 只有 getter，只能就地修改子字段 */
export function getButtonBarConfig(config: ConfigService): Record<string, unknown> {
    const root = config.store.pluginConfig as Record<string, unknown>
    if (!root['button-bar']) {
        root['button-bar'] = {}
    }
    return root['button-bar'] as Record<string, unknown>
}
