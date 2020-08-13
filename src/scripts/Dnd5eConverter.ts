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
            distance.long = ConversionEngine.convertDistanceFromImperialToMetric(distance.long, distance.units);

        distance.units = ConversionEngine.convertDistanceStringToMetric(distance.units);

        return distance;
    }

    private _itemsConverter(items: any): any {
        items.forEach((item) => {
            const target = item.data.target;
            const range = item.data.range;
            if (!target) return

            item.data.target = this._convertDistance(target);
            item.data.range = this._convertDistance(range);

            item.labels.target = this._labelConverter(item.labels.target);
            item.labels.range = this._labelConverter(item.labels.range);
        })
        return items;
    }


    private _speedConverter(speed: any): any {
        speed.value = this._labelConverter(speed.value);

        const specialSpeed = speed.special;
        speed.special = ConversionEngine.imperialReplacer(specialSpeed, /(?<value>[0-9]+) (?<unit>[\w]+)/g);

        return speed;
    }

    public toMetricConverter5e(data: any): any {
        if (data.converted) return data;

        const items = data.items;
        data.items = this._itemsConverter(items);

        data.data.attributes.speed = this._speedConverter(data.data.attributes.speed);

        data.data.traits.senses = ConversionEngine.imperialReplacer(data.data.traits.senses, /(?<value>[0-9]+) (?<unit>[\w]+)/g)

        data.converted = true;
        return data;
    }
}

export default Dnd5eConverter.getInstance();