import { Injectable, ComponentRef, Injector, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core'
import { AppService, ConfigService } from 'tabby-core'
import { ButtonBarComponent } from '../components/buttonBar.component'

const STYLE_ID = 'button-bar-style'
const BAR_ID = 'button-bar-wrapper'
const BODY_CLASS = 'tabby-button-bar-enabled'
const DEFAULT_BAR_HEIGHT = 40

@Injectable({ providedIn: 'root' })
export class ButtonBarService {
    private buttonBarRef: ComponentRef<ButtonBarComponent> | null = null
    private wrapperElement: HTMLElement | null = null
    private visible = false
    private resizeObserver: ResizeObserver | null = null
    private layoutFrame = 0
    private readySubscribed = false

    constructor(
        private injector: Injector,
        private appRef: ApplicationRef,
        private config: ConfigService,
        private app: AppService,
    ) {}

    get isVisible(): boolean {
        return this.visible
    }

    /** 与 tabby-broadcast-input 一致：等 Tabby ready 后再挂载 */
    ensureReadyHook(): void {
        if (this.readySubscribed) {
            return
        }
        this.readySubscribed = true
        this.app.ready$.subscribe(() => this.initialize())
    }

    initialize(): void {
        const pluginConfig = this.config.store.pluginConfig?.['button-bar'] || {}
        const savedVisible = pluginConfig.barVisible !== false

        if (savedVisible) {
            this.show()
        }
    }

    toggle(): void {
        if (this.visible) {
            this.hide()
        } else {
            this.show()
        }
    }

    show(): void {
        if (this.visible && this.wrapperElement) {
            return
        }

        this.installStyles()
        this.createButtonBar()
        this.visible = true
        this.saveVisibility()
    }

    hide(): void {
        if (!this.visible) {
            return
        }

        this.destroyButtonBar()
        this.visible = false
        this.saveVisibility()
    }

    private createButtonBar(): void {
        if (document.getElementById(BAR_ID)) {
            this.wrapperElement = document.getElementById(BAR_ID)
            return
        }

        this.wrapperElement = document.createElement('div')
        this.wrapperElement.id = BAR_ID

        const environmentInjector = this.injector.get(EnvironmentInjector)
        this.buttonBarRef = createComponent(ButtonBarComponent, {
            environmentInjector,
            elementInjector: this.injector,
            hostElement: this.wrapperElement,
        })

        this.buttonBarRef.instance.barService = this
        this.appRef.attachView(this.buttonBarRef.hostView)

        document.body.appendChild(this.wrapperElement)
        document.body.classList.add(BODY_CLASS)

        requestAnimationFrame(() => {
            this.scheduleLayoutAdjust()
        })

        this.observeBarHeight()
    }

    private destroyButtonBar(): void {
        this.disconnectResizeObserver()

        if (this.buttonBarRef) {
            this.appRef.detachView(this.buttonBarRef.hostView)
            this.buttonBarRef.destroy()
            this.buttonBarRef = null
        }

        if (this.wrapperElement?.parentNode) {
            this.wrapperElement.parentNode.removeChild(this.wrapperElement)
            this.wrapperElement = null
        }

        document.body.classList.remove(BODY_CLASS)
        this.clearLayout()
        this.removeStyles()
    }

    /**
     * 参考 tabby-broadcast-input：整体上移 app-root，底部 fixed 栏不挡终端。
     * @see C:/Users/Administrator/Documents/GitHub/tabby-broadcast-input/src/index.ts adjustLayout
     */
    private adjustLayout(barHeight: number): void {
        const appRoot = document.querySelector('app-root') as HTMLElement | null
        if (!appRoot) {
            return
        }

        const height = Math.max(0, Math.round(barHeight))
        const pos = window.getComputedStyle(appRoot).position

        if (pos === 'absolute' || pos === 'fixed') {
            appRoot.style.bottom = `${height}px`
            appRoot.style.paddingBottom = ''
        } else {
            appRoot.style.paddingBottom = `${height}px`
            appRoot.style.boxSizing = 'border-box'
            appRoot.style.bottom = ''
        }

        window.dispatchEvent(new Event('resize'))
    }

    private clearLayout(): void {
        const appRoot = document.querySelector('app-root') as HTMLElement | null
        if (!appRoot) {
            return
        }

        appRoot.style.bottom = ''
        appRoot.style.paddingBottom = ''
        appRoot.style.boxSizing = ''

        window.dispatchEvent(new Event('resize'))
    }

    private scheduleLayoutAdjust(): void {
        cancelAnimationFrame(this.layoutFrame)
        this.layoutFrame = requestAnimationFrame(() => {
            const height = this.wrapperElement?.offsetHeight || DEFAULT_BAR_HEIGHT
            this.adjustLayout(height)
        })
    }

    private observeBarHeight(): void {
        if (!this.wrapperElement || typeof ResizeObserver === 'undefined') {
            return
        }

        this.disconnectResizeObserver()
        this.resizeObserver = new ResizeObserver(() => this.scheduleLayoutAdjust())
        this.resizeObserver.observe(this.wrapperElement)
    }

    private disconnectResizeObserver(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
        cancelAnimationFrame(this.layoutFrame)
    }

    private saveVisibility(): void {
        const pluginConfig = this.config.store.pluginConfig || {}
        if (!pluginConfig['button-bar']) {
            pluginConfig['button-bar'] = {}
        }
        pluginConfig['button-bar'].barVisible = this.visible
        this.config.store.pluginConfig = pluginConfig
        this.config.save()
    }

    private installStyles(): void {
        if (document.getElementById(STYLE_ID)) {
            return
        }

        const style = document.createElement('style')
        style.id = STYLE_ID
        style.textContent = `
            #${BAR_ID} {
                position: fixed;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                width: 100%;
            }
        `
        document.head.appendChild(style)
    }

    private removeStyles(): void {
        const style = document.getElementById(STYLE_ID)
        style?.parentNode?.removeChild(style)
    }
}
