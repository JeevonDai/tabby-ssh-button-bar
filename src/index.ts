import { Injectable, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
    ConfigProvider,
    HotkeyProvider,
    CommandProvider,
    Command,
    CommandContext,
} from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'

import { ButtonBarComponent } from './components/buttonBar.component'
import { ButtonBarSettingsTabComponent } from './components/buttonBarSettingsTab.component'
import { ButtonBarService, BUTTON_BAR_TOGGLE_HOTKEY_ID } from './services/buttonBar.service'
import { ButtonBarSettingsTabProvider } from './settings'

@Injectable()
export class ButtonBarConfigProvider extends ConfigProvider {
    defaults = {
        pluginConfig: {
            'button-bar': {
                barVisible: true,
                lists: [],
                activeListId: '',
                useCommandAsLabel: true,
                commandLabelMaxLength: 24,
                defaultSendEnter: true,
            },
        },
        hotkeys: {
            [BUTTON_BAR_TOGGLE_HOTKEY_ID]: ['Ctrl-B'],
        },
    }
}

@Injectable()
export class ButtonBarHotkeyProvider extends HotkeyProvider {
    async provide() {
        return [
            {
                id: BUTTON_BAR_TOGGLE_HOTKEY_ID,
                name: 'Toggle button bar',
            },
        ]
    }
}

@Injectable()
export class ButtonBarCommandProvider extends CommandProvider {
    constructor(private buttonBarService: ButtonBarService) {
        super()
    }

    async provide(_context: CommandContext): Promise<Command[]> {
        return [
            {
                id: BUTTON_BAR_TOGGLE_HOTKEY_ID,
                label: 'Toggle button bar',
                sublabel: 'Show or hide the SSH button bar (Ctrl+B)',
                run: async () => {
                    this.buttonBarService.toggle()
                },
            },
        ]
    }
}

@NgModule({
    imports: [CommonModule, FormsModule],
    declarations: [ButtonBarComponent, ButtonBarSettingsTabComponent],
    exports: [ButtonBarComponent],
    providers: [
        ButtonBarService,
        { provide: ConfigProvider, useClass: ButtonBarConfigProvider, multi: true },
        { provide: HotkeyProvider, useClass: ButtonBarHotkeyProvider, multi: true },
        { provide: CommandProvider, useClass: ButtonBarCommandProvider, multi: true },
        { provide: SettingsTabProvider, useClass: ButtonBarSettingsTabProvider, multi: true },
    ],
})
export default class ButtonBarPluginModule {
    constructor(private buttonBarService: ButtonBarService) {
        this.buttonBarService.ensureReadyHook()
    }
}

export { ButtonBarComponent } from './components/buttonBar.component'
export { ButtonBarService, BUTTON_BAR_TOGGLE_HOTKEY_ID } from './services/buttonBar.service'
