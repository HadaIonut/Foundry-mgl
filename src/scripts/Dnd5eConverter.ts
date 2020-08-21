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
        const labelRegex = /((?<valueOpt>[0-9]+) \/ )?(?<value>[0-9]+) (?<unit>[\w]+)/;
        const matchedLabel = label.match(labelRegex)?.groups;
        if (!matchedLabel) return label;
        const unit = ConversionEngine.convertDistanceStringToMetric(matchedLabel.unit);
        let convertedLabel = '';

        if (!unit) return label;
        if (unit === 'Meters' || unit === 'm') {
            if (matchedLabel.valueOpt)
                convertedLabel += ConversionEngine.convertDistanceFromFeetToMeters(matchedLabel.valueOpt) + ' /';
            convertedLabel += ConversionEngine.convertDistanceFromImperialToMetric(matchedLabel.value, matchedLabel.unit) + ' ' + unit;
        }
        return convertedLabel;
    }

    private _convertDistance(distance: any): any {
        distance.value = ConversionEngine.convertDistanceFromImperialToMetric(distance.value, distance.units);
        if (distance?.long)
            distance.long = ConversionEngine.convertDistanceFromImperialToMetric(distance.long, distance.units);

        distance.units = ConversionEngine.convertDistanceStringToMetric(distance.units);

        return distance;
    }

    private _convertText(text: string): string {
        text = text.replace(/([0-9]{1,3}(,[0-9]{3})+) (feet)/g, (_0, number: string, _1, label: string) => {
            return ConversionEngine.convertDistanceFromFeetToMeters(number) + " " + ConversionEngine.convertDistanceStringToMetric(label);
        });
        text = text.replace(/([0-9]+)([\W\D\S]|&nbsp;| cubic ){1,2}(feet|inch|foot|ft\.)/g, (_0, number: string, separator: string ,label: string) => {
            return ConversionEngine.convertDistanceFromFeetToMeters(number) + separator + ConversionEngine.convertDistanceStringToMetric(label);
        });
        text = text.replace(/([0-9]+)(&nbsp;| )(pounds)/g, (_0, number: string, separator: string ,label: string) =>{
            return ConversionEngine.convertWeightFromPoundsToKilograms(number) + " " + ConversionEngine.convertWeightStringToKilograms(label)
        })
        return text;
    }

    private _itemsConverter(items: any): any {
        items.forEach((item) => {
            const target = item.data.target;
            const range = item.data.range;
            if (!target) return

            item.data.target = this._convertDistance(target);
            item.data.range = this._convertDistance(range)

            item.data.weight = ConversionEngine.convertWeightFromPoundsToKilograms(item.data.weight);
            item.totalWeight = ConversionEngine.convertWeightFromPoundsToKilograms(item.totalWeight);

            item.data.description.value = this._convertText(item.data.description.value);
        })
        return items
    }

    private _speedConverter(speed: any): any {
        speed.value = ConversionEngine.imperialReplacer(speed.value, /(?<value>[0-9]+) (?<unit>[\w]+)/g)

        const specialSpeed = speed.special;
        speed.special = ConversionEngine.imperialReplacer(specialSpeed, /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g);

        return speed;
    }

    private _toMetricConverter5e(data: any): any {
        const items = data.items;
        data.items = this._itemsConverter(items);

        data.data.attributes.speed = this._speedConverter(data.data.attributes.speed);

        data.data.traits.senses = ConversionEngine.imperialReplacer(data.data.traits.senses, /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)

        return data;
    }

    public async updater(actor: any) {
        const actorClone = await actor.object.clone({}, {temporary: true});
        actorClone.data = this._toMetricConverter5e(actorClone.data);

        await actor.object.update(actorClone.data);
    }
}

export default Dnd5eConverter.getInstance();