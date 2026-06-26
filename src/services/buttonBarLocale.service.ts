import { Injectable } from '@angular/core'
import { ConfigService, LocaleService, TranslateService } from 'tabby-core'
import { filter, take } from 'rxjs/operators'
import { BUTTON_BAR_TRANSLATIONS } from '../i18n'

@Injectable()
export class ButtonBarLocaleService {
    constructor(
        private translate: TranslateService,
        locale: LocaleService,
        config: ConfigService,
    ) {
        const register = () => this.registerAll()
        config.ready$.pipe(filter(Boolean), take(1)).subscribe(() => register())
        locale.localeChanged$.subscribe(() => register())
    }

    private registerAll(): void {
        for (const [lang, strings] of Object.entries(BUTTON_BAR_TRANSLATIONS)) {
            if (Object.keys(strings).length) {
                this.translate.setTranslation(lang, strings, true)
            }
        }
    }
}
