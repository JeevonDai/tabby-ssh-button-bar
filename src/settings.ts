import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { ButtonBarSettingsTabComponent } from './components/buttonBarSettingsTab.component'

@Injectable()
export class ButtonBarSettingsTabProvider extends SettingsTabProvider {
    id = 'button-bar'
    icon = 'keyboard'
    title = 'Button Bar'

    getComponentType(): any {
        return ButtonBarSettingsTabComponent
    }
}
