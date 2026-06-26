import { Component, HostBinding } from '@angular/core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { ConfigService, PlatformService } from 'tabby-core'
import { DEFAULT_BUTTON_BAR_CONFIG, getButtonBarConfig } from '../pluginConfig'
import type { ButtonCommand, ButtonList } from './buttonBar.component'

interface ButtonBarStorage {
    lists: ButtonList[]
    activeListId?: string
}

@Component({
    template: `
        <h3 translate>Button Bar</h3>

        <div class="form-line">
            <div class="header">
                <div class="title" translate>Use command as label</div>
                <div class="description" translate>Buttons display their command text by default.</div>
            </div>
            <input
                type="checkbox"
                class="form-check-input"
                [(ngModel)]="buttonBarConfig.useCommandAsLabel"
                (ngModelChange)="saveSettings()"
            >
        </div>

        <div class="form-line">
            <div class="header">
                <div class="title" translate>Command label max length</div>
                <div class="description" translate>Long command labels are shortened in the button bar.</div>
            </div>
            <input
                class="form-control"
                type="number"
                min="1"
                max="120"
                [(ngModel)]="buttonBarConfig.commandLabelMaxLength"
                (ngModelChange)="saveSettings()"
            >
        </div>

        <div class="form-line">
            <div class="header">
                <div class="title" translate>Default Send Enter after command</div>
                <div class="description" translate>New commands and commands without an explicit value send Enter automatically.</div>
            </div>
            <input
                type="checkbox"
                class="form-check-input"
                [(ngModel)]="buttonBarConfig.defaultSendEnter"
                (ngModelChange)="saveSettings()"
            >
        </div>

        <h4 translate>Commands</h4>

        <div class="form-line">
            <div class="header">
                <div class="title" translate>List</div>
                <div class="description" translate>Choose the button list to edit.</div>
            </div>
            <select
                class="form-control"
                [(ngModel)]="activeListId"
                (ngModelChange)="saveLists()"
                [disabled]="!lists.length"
            >
                <option *ngFor="let list of lists" [value]="list.id">{{ list.name }}</option>
            </select>
        </div>

        <div class="table-responsive" *ngIf="activeList; else noCommands">
            <table class="table table-sm align-middle">
                <thead>
                    <tr>
                        <th style="width: 86px;" translate>Order</th>
                        <th>
                            <span translate>Label</span><span *ngIf="buttonBarConfig.useCommandAsLabel" translate> (optional)</span>
                        </th>
                        <th translate>Command</th>
                        <th style="width: 110px;" translate>Send Enter</th>
                        <th style="width: 100px;" translate>Icon</th>
                        <th style="width: 92px;" translate>Color</th>
                        <th translate>Tooltip</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let button of activeList.buttons; let i = index">
                        <td>
                            <button class="btn btn-sm btn-secondary me-1" (click)="moveButton(i, -1)" [disabled]="i === 0" [title]="'Move up' | translate">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" (click)="moveButton(i, 1)" [disabled]="i === activeList.buttons.length - 1" [title]="'Move down' | translate">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </td>
                        <td>
                            <input class="form-control form-control-sm" [(ngModel)]="button.label" (ngModelChange)="saveLists()" [placeholder]="(buttonBarConfig.useCommandAsLabel ? 'Optional' : 'Label') | translate">
                        </td>
                        <td>
                            <input class="form-control form-control-sm" [(ngModel)]="button.command" (ngModelChange)="saveLists()">
                        </td>
                        <td class="text-center">
                            <input type="checkbox" class="form-check-input" [(ngModel)]="button.sendEnter" (ngModelChange)="saveLists()">
                        </td>
                        <td>
                            <input class="form-control form-control-sm" [(ngModel)]="button.icon" (ngModelChange)="saveLists()">
                        </td>
                        <td>
                            <input class="form-control form-control-sm" type="color" [(ngModel)]="button.color" (ngModelChange)="saveLists()">
                        </td>
                        <td>
                            <input class="form-control form-control-sm" [(ngModel)]="button.tooltip" (ngModelChange)="saveLists()">
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <ng-template #noCommands>
            <p class="text-muted" translate>No command list found.</p>
        </ng-template>
    `,
})
export class ButtonBarSettingsTabComponent {
    @HostBinding('class.content-box') true

    lists: ButtonList[] = []
    activeListId = ''

    constructor(
        public config: ConfigService,
        private platformService: PlatformService,
    ) {
        Object.assign(this.buttonBarConfig, {
            useCommandAsLabel: DEFAULT_BUTTON_BAR_CONFIG.useCommandAsLabel,
            commandLabelMaxLength: DEFAULT_BUTTON_BAR_CONFIG.commandLabelMaxLength,
            defaultSendEnter: DEFAULT_BUTTON_BAR_CONFIG.defaultSendEnter,
            ...this.buttonBarConfig,
        })
        this.loadLists()
    }

    get buttonBarConfig(): Record<string, any> {
        return getButtonBarConfig(this.config)
    }

    get activeList(): ButtonList | undefined {
        return this.lists.find(list => list.id === this.activeListId) || this.lists[0]
    }

    saveSettings(): void {
        this.buttonBarConfig.commandLabelMaxLength = this.normalizeMaxLength(this.buttonBarConfig.commandLabelMaxLength)
        this.config.save()
    }

    saveLists(): void {
        if (this.activeListId && !this.lists.some(list => list.id === this.activeListId)) {
            this.activeListId = this.lists[0]?.id || ''
        }
        this.buttonBarConfig.lists = this.lists
        this.buttonBarConfig.activeListId = this.activeListId
        this.saveStorageLists()
        this.config.save()
    }

    moveButton(index: number, direction: number): void {
        const list = this.activeList
        if (!list) {
            return
        }
        const nextIndex = index + direction
        if (nextIndex < 0 || nextIndex >= list.buttons.length) {
            return
        }
        const [button] = list.buttons.splice(index, 1)
        list.buttons.splice(nextIndex, 0, button)
        this.saveLists()
    }

    private loadLists(): void {
        const storage = this.loadStorageLists()
        if (storage?.lists?.length) {
            this.lists = storage.lists
            this.activeListId = storage.activeListId || this.lists[0].id
            this.saveLists()
            return
        }

        const configLists = this.buttonBarConfig.lists
        if (Array.isArray(configLists) && configLists.length) {
            this.lists = configLists as ButtonList[]
            this.activeListId = this.buttonBarConfig.activeListId || this.lists[0].id
        }
    }

    private getStoragePath(): string | null {
        const configPath = this.platformService.getConfigPath()
        if (!configPath) {
            return null
        }
        return path.join(path.dirname(configPath), 'button-bar-lists.json')
    }

    private loadStorageLists(): ButtonBarStorage | null {
        const storagePath = this.getStoragePath()
        if (!storagePath || !existsSync(storagePath)) {
            return null
        }
        try {
            return JSON.parse(readFileSync(storagePath, 'utf8')) as ButtonBarStorage
        } catch (error) {
            console.warn('ButtonBar: Unable to read storage file', error)
            return null
        }
    }

    private saveStorageLists(): void {
        const storagePath = this.getStoragePath()
        if (!storagePath) {
            return
        }
        try {
            mkdirSync(path.dirname(storagePath), { recursive: true })
            writeFileSync(storagePath, JSON.stringify({
                lists: this.lists,
                activeListId: this.activeListId,
            }, null, 2), 'utf8')
        } catch (error) {
            console.warn('ButtonBar: Unable to persist lists', error)
        }
    }

    private normalizeMaxLength(value: unknown): number {
        const parsed = Math.floor(Number(value) || DEFAULT_BUTTON_BAR_CONFIG.commandLabelMaxLength)
        return Math.min(120, Math.max(1, parsed))
    }
}
