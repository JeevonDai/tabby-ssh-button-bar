import { Component, HostBinding } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { DEFAULT_BUTTON_BAR_CONFIG, getButtonBarConfig } from '../pluginConfig'

@Component({
    template: `
        <h3>Button Bar</h3>

        <div class="form-line">
            <div class="header">
                <div class="title">Use command as label</div>
                <div class="description">Buttons display their command text by default.</div>
            </div>
            <toggle
                [(ngModel)]="buttonBarConfig.useCommandAsLabel"
                (ngModelChange)="save()"
            ></toggle>
        </div>

        <div class="form-line">
            <div class="header">
                <div class="title">Default Send Enter after command</div>
                <div class="description">New commands and commands without an explicit value send Enter automatically.</div>
            </div>
            <toggle
                [(ngModel)]="buttonBarConfig.defaultSendEnter"
                (ngModelChange)="save()"
            ></toggle>
        </div>
    `,
})
export class ButtonBarSettingsTabComponent {
    @HostBinding('class.content-box') true

    constructor(public config: ConfigService) {
        Object.assign(this.buttonBarConfig, {
            useCommandAsLabel: DEFAULT_BUTTON_BAR_CONFIG.useCommandAsLabel,
            commandLabelMaxLength: DEFAULT_BUTTON_BAR_CONFIG.commandLabelMaxLength,
            defaultSendEnter: DEFAULT_BUTTON_BAR_CONFIG.defaultSendEnter,
            ...this.buttonBarConfig,
        })
    }

    get buttonBarConfig(): Record<string, any> {
        return getButtonBarConfig(this.config)
    }

    save(): void {
        this.buttonBarConfig.commandLabelMaxLength = this.normalizeMaxLength(this.buttonBarConfig.commandLabelMaxLength)
        this.config.save()
    }

    private normalizeMaxLength(value: unknown): number {
        const parsed = Math.floor(Number(value) || DEFAULT_BUTTON_BAR_CONFIG.commandLabelMaxLength)
        return Math.min(120, Math.max(1, parsed))
    }
}
