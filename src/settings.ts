import { Injectable } from '@angular/core'
import { TranslateService } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'
import { ButtonBarSettingsTabComponent } from './components/buttonBarSettingsTab.component'

@Injectable()
export class ButtonBarSettingsTabProvider extends SettingsTabProvider {
    id = 'button-bar'
    icon = 'keyboard'
    override title = 'Button Bar'

    constructor(private translate: TranslateService) {
        super()
        this.refreshTitle()
        this.translate.onLangChange.subscribe(() => this.refreshTitle())
    }

    getComponentType(): any {
        return ButtonBarSettingsTabComponent
    }

    private refreshTitle(): void {
        this.title = this.translate.instant('Button Bar')
    }
}
