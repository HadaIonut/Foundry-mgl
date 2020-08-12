import ConversionEngine from "./ConversionEngine";

class Dnd5eConverter {
    private static _instance: Dnd5eConverter;

    private constructor() {
    }

    public static getInstance(): Dnd5eConverter {
        if (!Dnd5eConverter._instance) Dnd5eConverter._instance = new Dnd5eConverter();
        return Dnd5eConverter._instance;
    }

    private _labelConverter(label: string): any {
        const labelRegex = /(?<value>[0-9]+) (?<unit>[\w]+)/;
        const matchedLabel = label.match(labelRegex)?.groups;
        if (!matchedLabel) return label;
        const unit = ConversionEngine.convertDistanceStringToMetric(matchedLabel.unit);

        if (!unit) return label;
        if (unit === 'Meters' || unit === 'm')
            return ConversionEngine.convertDistanceFromImperialToMetric(matchedLabel.value, matchedLabel.unit) + ' ' + unit;

    }

    private _convertDistance(distance: any): any {
        distance.value = ConversionEngine.convertDistanceFromImperialToMetric(distance.value, distance.units);
        if (distance?.long)
            distance.long = ConversionEngine.convertDistanceFromImperialToMetric(distance.long,distance.units);

        distance.value = ConversionEngine.convertDistanceFromImperialToMetric(distance.value, distance.units);
        if (distance?.long)
            distance.long = ConversionEngine.convertDistanceFromImperialToMetric(distance.long, distance.units);

        distance.units = ConversionEngine.convertDistanceStringToMetric(distance.units);

        return distance;
    }

    public toMetricConverter5e(data: any): any {
        const items = data.items;
        items.forEach((item) => {
            const target = item.data.target;
            const range = item.data.range;
            if (!target) return


            item.data.target = this._convertDistance(target);
            item.data.range = this._convertDistance(range);


            item.labels.target = this._labelConverter(item.labels.target);
            item.labels.range = this._labelConverter(item.labels.range);
        })
        data.data.attributes.speed.value = this._labelConverter(data.data.attributes.speed.value);
        return data;
    }
}

export default Dnd5eConverter.getInstance();