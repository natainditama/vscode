/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { IStorageService, StorageScope, StorageTarget } from 'vs/platform/storage/common/storage';
import { LayoutSettings } from 'vs/workbench/services/layout/browser/layoutService';
import { Action2, MenuId, registerAction2 } from 'vs/platform/actions/common/actions';
import { ContextKeyExpr, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { ACCOUNTS_ACTIVITY_ID, GLOBAL_ACTIVITY_ID } from 'vs/workbench/common/activity';
import { IAction } from 'vs/base/common/actions';
import { IsAuxiliaryWindowFocusedContext, IsMainWindowFullscreenContext, TitleBarStyleContext, TitleBarVisibleContext } from 'vs/workbench/common/contextkeys';
import { CustomTitleBarVisibility, TitleBarSetting, TitlebarStyle } from 'vs/platform/window/common/window';

// --- Context Menu Actions --- //

class ToggleConfigAction extends Action2 {

	constructor(private readonly section: string, title: string, order: number, mainWindowOnly: boolean) {
		const when = mainWindowOnly ? IsAuxiliaryWindowFocusedContext.toNegated() : ContextKeyExpr.true();
		super({
			id: `toggle.${section}`,
			title,
			toggled: ContextKeyExpr.equals(`config.${section}`, true),
			menu: [
				{
					id: MenuId.TitleBarContext,
					when,
					order,
					group: '2_config'
				},
				{
					id: MenuId.TitleBarTitleContext,
					when,
					order,
					group: '2_config'
				}
			]
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		const value = configService.getValue(this.section);
		configService.updateValue(this.section, !value);
	}
}

registerAction2(class ToggleCommandCenter extends ToggleConfigAction {
	constructor() {
		super(LayoutSettings.COMMAND_CENTER, localize('toggle.commandCenter', 'Command Center'), 1, false);
	}
});

registerAction2(class ToggleLayoutControl extends ToggleConfigAction {
	constructor() {
		super('workbench.layoutControl.enabled', localize('toggle.layout', 'Layout Controls'), 2, true);
	}
});

registerAction2(class ToggleCustomTitleBar extends Action2 {
	constructor() {
		super({
			id: `toggle.${TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY}`,
			title: localize('toggle.hideCustomTitleBar', 'Hide Custom Title Bar'),
			menu: [
				{ id: MenuId.TitleBarContext, order: 0, when: ContextKeyExpr.equals(TitleBarStyleContext.key, TitlebarStyle.NATIVE), group: '3_toggle' },
				{ id: MenuId.TitleBarTitleContext, order: 0, when: ContextKeyExpr.equals(TitleBarStyleContext.key, TitlebarStyle.NATIVE), group: '3_toggle' },
			]
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.NEVER);
	}
});

registerAction2(class ToggleCustomTitleBarWindowed extends Action2 {
	constructor() {
		super({
			id: `toggle.${TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY}.windowed`,
			title: localize('toggle.hideCustomTitleBarInFullScreen', 'Hide Custom Title Bar In Full Screen'),
			menu: [
				{ id: MenuId.TitleBarContext, order: 1, when: IsMainWindowFullscreenContext, group: '3_toggle' },
				{ id: MenuId.TitleBarTitleContext, order: 1, when: IsMainWindowFullscreenContext, group: '3_toggle' },
			]
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.WINDOWED);
	}
});


class ToggleCustomTitleBar extends Action2 {

	constructor() {
		super({
			id: `toggle.toggleCustomTitleBar`,
			title: localize('toggle.customTitleBar', 'Custom Title Bar'),
			toggled: TitleBarVisibleContext,
			menu: [
				{ id: MenuId.MenubarAppearanceMenu, order: 6, when: ContextKeyExpr.or(ContextKeyExpr.equals(TitleBarStyleContext.key, TitlebarStyle.NATIVE), IsMainWindowFullscreenContext), group: '2_workbench_layout' },
			]
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		const contextKeyService = accessor.get(IContextKeyService);
		const titleBarVisibility = configService.getValue<CustomTitleBarVisibility>(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY);
		switch (titleBarVisibility) {
			case CustomTitleBarVisibility.NEVER:
				configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.AUTO);
				break;
			case CustomTitleBarVisibility.WINDOWED: {
				const isFullScreen = IsMainWindowFullscreenContext.evaluate(contextKeyService.getContext(null));
				if (isFullScreen) {
					configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.AUTO);
				} else {
					configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.NEVER);
				}
				break;
			}
			case CustomTitleBarVisibility.AUTO:
			default:
				configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.NEVER);
				break;
		}
	}
}
registerAction2(ToggleCustomTitleBar);

registerAction2(class ShowCustomTitleBar extends Action2 {
	constructor() {
		super({
			id: `showCustomTitleBar`,
			title: { value: localize('showCustomTitleBar', 'Show Custom Title Bar'), original: 'Show Custom Title Bar' },
			precondition: TitleBarVisibleContext.negate(),
			f1: true
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.AUTO);
	}
});


registerAction2(class HideCustomTitleBar extends Action2 {
	constructor() {
		super({
			id: `hideCustomTitleBar`,
			title: { value: localize('hideCustomTitleBar', 'Hide Custom Title Bar'), original: 'Hide Custom Title Bar' },
			precondition: TitleBarVisibleContext,
			f1: true
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.NEVER);
	}
});

registerAction2(class HideCustomTitleBar extends Action2 {
	constructor() {
		super({
			id: `hideCustomTitleBarInFullScreen`,
			title: { value: localize('hideCustomTitleBarInFullScreen', 'Hide Custom Title Bar In Full Screen'), original: 'Hide Custom Title Bar In Full Screen' },
			precondition: ContextKeyExpr.and(TitleBarVisibleContext, IsMainWindowFullscreenContext),
			f1: true
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		configService.updateValue(TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY, CustomTitleBarVisibility.WINDOWED);
	}
});

registerAction2(class ToggleEditorActions extends Action2 {
	static readonly settingsID = `workbench.editor.editorActionsLocation`;
	constructor() {

		const titleBarContextCondition = ContextKeyExpr.and(
			ContextKeyExpr.equals(`config.workbench.editor.showTabs`, 'none').negate(),
			ContextKeyExpr.equals(`config.${ToggleEditorActions.settingsID}`, 'default'),
		)?.negate();

		super({
			id: `toggle.${ToggleEditorActions.settingsID}`,
			title: localize('toggle.editorActions', 'Editor Actions'),
			toggled: ContextKeyExpr.equals(`config.${ToggleEditorActions.settingsID}`, 'hidden').negate(),
			menu: [
				{ id: MenuId.TitleBarContext, order: 3, when: titleBarContextCondition, group: '2_config' },
				{ id: MenuId.TitleBarTitleContext, order: 3, when: titleBarContextCondition, group: '2_config' }
			]
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		const storageService = accessor.get(IStorageService);

		const location = configService.getValue<string>(ToggleEditorActions.settingsID);
		if (location === 'hidden') {
			const showTabs = configService.getValue<string>(LayoutSettings.EDITOR_TABS_MODE);

			// If tabs are visible, then set the editor actions to be in the title bar
			if (showTabs !== 'none') {
				configService.updateValue(ToggleEditorActions.settingsID, 'titleBar');
			}

			// If tabs are not visible, then set the editor actions to the last location the were before being hidden
			else {
				const storedValue = storageService.get(ToggleEditorActions.settingsID, StorageScope.PROFILE);
				configService.updateValue(ToggleEditorActions.settingsID, storedValue ?? 'default');
			}

			storageService.remove(ToggleEditorActions.settingsID, StorageScope.PROFILE);
		}
		// Store the current value (titleBar or default) in the storage service for later to restore
		else {
			configService.updateValue(ToggleEditorActions.settingsID, 'hidden');
			storageService.store(ToggleEditorActions.settingsID, location, StorageScope.PROFILE, StorageTarget.USER);
		}
	}
});

registerAction2(class ToggleActivityBarActions extends Action2 {
	static readonly settingsID = `workbench.activityBar.location`;
	constructor() {

		super({
			id: `toggle.${ToggleActivityBarActions.settingsID}`,
			title: localize('toggle.activityBarActions', 'Activity Bar Actions'),
			toggled: ContextKeyExpr.equals(`config.${ToggleActivityBarActions.settingsID}`, 'top'),
			menu: [
				{ id: MenuId.TitleBarContext, order: 4, when: ContextKeyExpr.notEquals(`config.${ToggleActivityBarActions.settingsID}`, 'side'), group: '2_config' },
				{ id: MenuId.TitleBarTitleContext, order: 4, when: ContextKeyExpr.notEquals(`config.${ToggleActivityBarActions.settingsID}`, 'side'), group: '2_config' }
			]
		});
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const configService = accessor.get(IConfigurationService);
		const oldLocation = configService.getValue<string>(ToggleActivityBarActions.settingsID);
		configService.updateValue(ToggleActivityBarActions.settingsID, oldLocation === 'top' ? 'hidden' : 'top');
	}
});

// --- Toolbar actions --- //

export const ACCOUNTS_ACTIVITY_TILE_ACTION: IAction = {
	id: ACCOUNTS_ACTIVITY_ID,
	label: localize('accounts', "Accounts"),
	tooltip: localize('accounts', "Accounts"),
	class: undefined,
	enabled: true,
	run: function (): void { }
};

export const GLOBAL_ACTIVITY_TITLE_ACTION: IAction = {
	id: GLOBAL_ACTIVITY_ID,
	label: localize('manage', "Manage"),
	tooltip: localize('manage', "Manage"),
	class: undefined,
	enabled: true,
	run: function (): void { }
};
