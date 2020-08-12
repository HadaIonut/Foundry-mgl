class ConversionEngine {
    private static _instance: ConversionEngine;

    private constructor() {
    }

    public static getInstance(): ConversionEngine {
        if (!ConversionEngine._instance) ConversionEngine._instance = new ConversionEngine();
        return ConversionEngine._instance;
    }

    private _distanceToMetricMap: { [key: string]: string } = {
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

    private _roundUp(nr: number): number {
        return Math.round((nr + Number.EPSILON) * 100) / 100;
    }

    private _cleanCommas(text: string): string {
        return text.replace(",", "");
    }

    private _convertStringToNumber(toConvert: string): number {
        const numberToReturn = Number(this._cleanCommas(toConvert));
        return isNaN(numberToReturn) ? -1 : numberToReturn;
    }

    private _convertDistanceFromFeetToMeters(distance: string | number): number {
        let dist = typeof distance === 'number' ? distance : this._convertStringToNumber(distance);
        dist /= 5;

        return this._roundUp(dist + dist / 2);
    }

    private _convertDistanceFromMilesToKilometers(distance: string | number): number {
        const dist = typeof distance === 'number' ? distance : this._convertStringToNumber(distance);

        return this._roundUp(dist * 1.6);
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
     * Converts units from imperial to metric
     *
     * @param ftString - the imperial unit to convert
     */
    public convertDistanceStringToMetric(ftString: string): string {
        return this._distanceToMetricMap[ftString];
    }

    /**
     * Converts distances from imperial to metric
     *
     * @param distance - value to be converted
     * @param unit - "feet" or "mile"
     */
    public convertDistanceFromImperialToMetric(distance: string | number, unit: string): number {
        const convertedToStandard = this._convertDistanceUnitStringToStandard(unit);
        if (convertedToStandard === "feet") return this._convertDistanceFromFeetToMeters(distance);
        if (convertedToStandard === "mile") return this._convertDistanceFromMilesToKilometers(distance)

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