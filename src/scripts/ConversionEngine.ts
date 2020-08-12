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
        "foot": "meter",
        "mile": "kilometres",
        "miles": "kilometres"
    };

    private _convertDistanceStringToMetric(ftString: string): string {
        return this._distanceToMetricMap[ftString] || '';
    }

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

    private _convertDistance(distance: any): any {
        if (distance.units == 'ft'){
            distance.value = this._convertDistanceFromFeetToMeters(distance.value);
            if (distance?.long) distance.long = this._convertDistanceFromFeetToMeters(distance.long);
        }

        if (distance.units == 'mile'){
            distance.value = this._convertDistanceFromMilesToKilometers(distance.value);
            if (distance?.long) distance.long = this._convertDistanceFromMilesToKilometers(distance.long);
        }

        distance.units = this._convertDistanceStringToMetric(distance.units);

        return distance;
    }

    public toMetricConverter(data: any): any {
        const items = data.items;
        items.forEach((item) => {
            const target = item.data.target;
            const range = item.data.range;
            if (!target) return


            item.data.target = this._convertDistance(target);
            item.data.range = this._convertDistance(range)

        })

        return data;
    }
}

export default ConversionEngine.getInstance();