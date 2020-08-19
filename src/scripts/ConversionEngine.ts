import Settings from "./Settings";

class ConversionEngine {

    private static _instance: ConversionEngine;

    private constructor() {
    }

    public static getInstance(): ConversionEngine {
        if (!ConversionEngine._instance) ConversionEngine._instance = new ConversionEngine();
        return ConversionEngine._instance;
    }

    //TODO: make this a setting
    private _conversionMultipliers: { [key: string]: number } = {
        "inch": 2.5,
        "feet": 0.3,
        "mile": 1.6,
        "pound": 0.5
    }

    get conversionMultipliers(): { [p: string]: number } {
        return this._conversionMultipliers;
    }
    private _distanceToMetricMap: { [key: string]: string } = {
        "inch": "centimeters",
        "ft.": "m.",
        "ft": "m",
        "feet": "meters",
        "Feet": "Meters",
        "foot": "meter",
        "mile": "kilometres",
        "miles": "kilometres"
    };

    private _typesOfUnitsMap: { [key: string]: string } = {
        "ft.": "feet",
        "ft": "feet",
        "feet": "feet",
        "Feet": "feet",
        "foot": "feet",
        "mile": "mile",
        "Mile": "mile",
        "Miles": "mile",
        "miles": "mile",
    };

    private _weightToKilogramsMap: { [key: string]: string } = {
        "lb.": "kg.",
        "lbs.": "kg.",
        "pounds": "kilograms",
        "pound": "kilogram"
    };

    private _roundUp(nr: number): number {
        return Math.round((nr + Number.EPSILON) * 100) / 100;
    }

    private _cleanCommas(text: string): string {
        if (!text) return
        return text.replace(",", "");
    }

    private _convertStringToNumber(toConvert: string): number {
        const numberToReturn = Number(this._cleanCommas(toConvert));
        return isNaN(numberToReturn) ? -1 : numberToReturn;
    }

    private _convertUsingMultiplier(toBeConverted: string | number, multiplier: number): number {
        if (!toBeConverted) return ;
        const toConvert = typeof toBeConverted === 'number' ? toBeConverted : this._convertStringToNumber(toBeConverted);

        return this._roundUp(toConvert * multiplier);
    }

    /**
     * Converts strings or numbers from pounds to kilograms
     *
     * @param weightString - string or number to be converted
     */
    public convertWeightFromPoundsToKilograms(weightString: string | number): number {
        return this._convertUsingMultiplier(weightString, Settings.getMultiplier('pound'));
    }

    /**
     * Converts strings or numbers from inch to centimeters
     *
     * @param distance - string or number to be converted
     */
    public convertDistanceFromInchToCentimeters(distance: string | number): number {
        return this._convertUsingMultiplier(distance, Settings.getMultiplier('inch'));
    }

    /**
     * Converts strings or numbers from feet to meters
     *
     * @param distance - string or number to be converted
     */
    public convertDistanceFromFeetToMeters(distance: string | number): number {
        return this._convertUsingMultiplier(distance, Settings.getMultiplier('feet'));
    }

    /**
     * Converts strings or numbers from miles to km
     *
     * @param distance - string or number to be converted
     */
    public convertDistanceFromMilesToKilometers(distance: string | number): number {
        return this._convertUsingMultiplier(distance, Settings.getMultiplier('mile'));
    }

    /**
     * Converts imperial units to a single standard
     * The standard I chose is "feet" and "mile"
     *
     * @param unit - the unit that is in a non standard form
     */
    public _convertDistanceUnitStringToStandard(unit: string): string {
        return this._typesOfUnitsMap[unit];
    }

    /**
     * Converts weight units from imperial to metric
     *
     * @param lbString - the imperial unit to convert
     */
    public convertWeightStringToKilograms(lbString: string): string {
        return this._weightToKilogramsMap[lbString] || 'lb.';
    }

    /**
     * Converts distance units from imperial to metric
     *
     * @param ftString - the imperial unit to convert
     */
    public convertDistanceStringToMetric(ftString: string): string {
        return this._distanceToMetricMap[ftString] || ftString;
    }

    /**
     * Converts distances from imperial to metric
     *
     * @param distance - value to be converted
     * @param unit - "feet" or "mile"
     */
    public convertDistanceFromImperialToMetric(distance: string | number, unit: string): string | number {
        const convertedToStandard = this._convertDistanceUnitStringToStandard(unit);
        if (convertedToStandard === "feet") return this.convertDistanceFromFeetToMeters(distance);
        if (convertedToStandard === "mile") return this.convertDistanceFromMilesToKilometers(distance);
        return distance;
    }

    /**
     * Replaces an imperial value with a metric one
     *
     * @param toReplace - string that contains an imperial value
     * @param replaceRegex - regex to replace the imperial value
     */
    public imperialReplacer(toReplace: string, replaceRegex: RegExp): string {
        return toReplace.replace(replaceRegex, (element: string, value: string, unit: string): string => {
            const replacedValue = this.convertDistanceFromImperialToMetric(value, unit);
            const replacedUnit = this.convertDistanceStringToMetric(unit);
            return replacedValue + ' ' + replacedUnit;
        })
    }
}

export default ConversionEngine.getInstance();