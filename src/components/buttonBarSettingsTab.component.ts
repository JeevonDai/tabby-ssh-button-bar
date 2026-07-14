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
                            {{ (buttonBarConfig.useCommandAsLabel ? 'Label (optional)' : 'Label') | translate }}
                        </th>
                        <th translate>Command</th>
                        <th style="width: 110px;" translate>Send Enter</th>
                        <th style="width: 44px;"></th>
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
                            <button
                                type="button"
                                class="btn btn-sm btn-secondary appearance-btn"
                                (click)="openAppearanceModal(button)"
                                [title]="'Edit appearance' | translate"
                                [style.--btn-preview-color]="getButtonColor(button)"
                            >
                                <i *ngIf="button.icon" class="fas" [ngClass]="'fa-' + button.icon"></i>
                                <i *ngIf="!button.icon" class="fas fa-palette"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <ng-template #noCommands>
            <p class="text-muted" translate>No command list found.</p>
        </ng-template>

        <div class="modal-backdrop" *ngIf="appearanceModalVisible" (click)="closeAppearanceModal()"></div>
        <div class="appearance-modal" *ngIf="appearanceModalVisible">
            <div class="modal-header">
                <h5 translate>Edit appearance</h5>
                <button type="button" class="btn btn-link" (click)="closeAppearanceModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group mb-3">
                    <label class="form-label" translate>Icon (FontAwesome name, optional)</label>
                    <input type="text" class="form-control" [(ngModel)]="appearanceData.icon" [placeholder]="'e.g., folder, server, code' | translate">
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" translate>Color (optional)</label>
                    <div class="color-picker">
                        <button *ngFor="let color of presetColors"
                                type="button"
                                class="color-option"
                                [style.background]="color"
                                [class.selected]="appearanceData.color === color"
                                (click)="appearanceData.color = color">
                        </button>
                        <input type="color" [(ngModel)]="appearanceData.color" class="color-input">
                    </div>
                </div>
                <div class="form-group mb-0">
                    <label class="form-label" translate>Tooltip (optional)</label>
                    <input type="text" class="form-control" [(ngModel)]="appearanceData.tooltip" [placeholder]="'Description shown on hover' | translate">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeAppearanceModal()" translate>Cancel</button>
                <button type="button" class="btn btn-primary" (click)="saveAppearanceModal()" translate>Save</button>
            </div>
        </div>
    `,
    styles: [`
        .appearance-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 28px;
            padding: 0;
            line-height: 1;
            background: var(--btn-preview-color, var(--bs-secondary-bg, #4a4a4a));
            border-color: var(--bs-border-color, #555);
            color: var(--bs-body-color, #e0e0e0);
        }

        .appearance-btn i {
            font-size: 11px;
            line-height: 1;
        }

        .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
        }

        .appearance-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bs-body-bg);
            border: 1px solid var(--bs-border-color);
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            width: min(420px, 90vw);
        }

        .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid var(--bs-border-color);
        }

        .modal-body {
            padding: 16px;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid var(--bs-border-color);
        }

        .form-label {
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .color-picker {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .color-option {
            width: 20px;
            height: 20px;
            border-radius: 3px;
            border: 2px solid transparent;
            cursor: pointer;
            padding: 0;
        }

        .color-option.selected {
            border-color: white;
            box-shadow: 0 0 0 2px var(--bs-primary);
        }

        .color-input {
            width: 28px;
            height: 20px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            padding: 0;
        }
    `],
})
export class ButtonBarSettingsTabComponent {
    @HostBinding('class.content-box') true

    lists: ButtonList[] = []
    activeListId = ''
    appearanceModalVisible = false
    editingButton: ButtonCommand | null = null
    appearanceData: { icon: string, color: string, tooltip: string } = {
        icon: '',
        color: '#4a4a4a',
        tooltip: '',
    }

    presetColors = [
        '#4a4a4a',
        '#0d6efd',
        '#198754',
        '#dc3545',
        '#ffc107',
        '#0dcaf0',
        '#6f42c1',
        '#fd7e14',
    ]

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

    getButtonColor(button: ButtonCommand): string {
        if (!button.color || button.color.toLowerCase() === '#4a4a4a') {
            return 'var(--bs-secondary-bg, #4a4a4a)'
        }
        return button.color
    }

    openAppearanceModal(button: ButtonCommand): void {
        this.editingButton = button
        this.appearanceData = {
            icon: button.icon || '',
            color: button.color || this.presetColors[0],
            tooltip: button.tooltip || '',
        }
        this.appearanceModalVisible = true
    }

    closeAppearanceModal(): void {
        this.appearanceModalVisible = false
        this.editingButton = null
    }

    saveAppearanceModal(): void {
        if (!this.editingButton) {
            return
        }
        const icon = this.appearanceData.icon.trim()
        const tooltip = this.appearanceData.tooltip.trim()
        this.editingButton.icon = icon || undefined
        this.editingButton.color = this.appearanceData.color || undefined
        this.editingButton.tooltip = tooltip || undefined
        this.saveLists()
        this.closeAppearanceModal()
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
