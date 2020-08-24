import utils from './Utils'
import settingsLists from "./settingsLists";

class Settings {
    private static _instance: Settings;

    private constructor() {
    }

    public static getInstance(): Settings {
        if (!Settings._instance) Settings._instance = new Settings();
        return Settings._instance;
    }

    private _registerSetting(key: string, data: any): void {
        game.settings.register(utils.moduleName, key, data);
    }

    private _getSetting(key: string): any {
        return game.settings.get(utils.moduleName, key);
    }

    private _getMultipliers(): any {
        const setting = this.getSetting("conversionMultipliers");
        try {
            return JSON.parse(setting);
        } catch (error) {
            return {};
        }
    }

    public registerSettings(): void {
        settingsLists.SETTINGS.forEach((setting: any): void => {
            this._registerSetting(setting.key, setting.data);
        });
    }

    /**
     * Returns a setting
     *
     * @param key
     */

    public getSetting(key: string): any {
        return this._getSetting(key);
    }

    /**
     * Sets a setting
     *
     * @param key - key of the setting
     * @param data - data to store
     */
    public setSetting(key: string, data: any): Promise<any> {
        return game.settings.set(utils.moduleName, key, data);
    }

    /**
     * Returns the multiplier for converting a unit
     *
     * @param unit
     */
    public getMultiplier(unit: string): number {
        const multipliers = this._getMultipliers();
        return multipliers[unit];
    }

    /**
     * Sets a units multiplier
     *
     * @param unit - unit
     * @param value - multiplier
     */
    public setMultiplier(unit: string, value: number) {
        let multipliers = this._getMultipliers();
        multipliers[unit] = value;
        this.setSetting("conversionMultipliers", JSON.stringify(multipliers))
    }


}

export default Settings.getInstance();