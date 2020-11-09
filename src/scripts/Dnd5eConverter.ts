import ConversionEngine from "./ConversionEngine";
import {numberSelecter} from "./WordsToNumbers";

class Dnd5eConverter {
    private static _instance: Dnd5eConverter;

    private constructor() {
    }

    public static getInstance(): Dnd5eConverter {
        if (!Dnd5eConverter._instance) Dnd5eConverter._instance = new Dnd5eConverter();
        return Dnd5eConverter._instance;
    }

    /**
     * Converts item labels to metric
     *
     * @param label - the label of an item (can be found at actor.data.items.label)
     */
    private _labelConverter(label: string): any {
        if (!label) return;
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

    /**
     * Converts range and target structures to metric
     *
     * @param distance - object to be converted (format can be found at actor.data.items[0].range)
     */
    private _convertDistance(distance: any): any {
        if (!distance) return;
        distance.value = ConversionEngine.convertDistanceFromImperialToMetric(distance.value, distance.units);
        if (distance?.long)
            distance.long = ConversionEngine.convertDistanceFromImperialToMetric(distance.long, distance.units);

        distance.units = ConversionEngine.convertDistanceStringToMetric(distance.units);

        return distance;
    }

    /**
     * Converts text containing imperial units to metric
     *
     * @param text - text containing imperial units
     */
    private _convertText(text: string): string {
        text = text.replace(/([0-9]{1,3}(,[0-9]{3})+) (pounds)/g, (_0, number: string, _1, label: string) => {
            return ConversionEngine.convertWeightFromPoundsToKilograms(number) + " " + ConversionEngine.convertWeightStringToKilograms(label);
        });
        text = text.replace(/([0-9]{1,3}(,[0-9]{3})+) (feet)/g, (_0, number: string, _1, label: string) => {
            return ConversionEngine.convertDistanceFromFeetToMeters(number) + " " + ConversionEngine.convertDistanceStringToMetric(label);
        });
        text = text.replace(/([0-9]+)\/([0-9]+) (feet|inch|foot|ft\.)/g, (_0, firstNumber: string, secondNumber: string, label: string) => {
            return ConversionEngine.convertDistanceFromFeetToMeters(firstNumber) + '/' + ConversionEngine.convertDistanceFromFeetToMeters(secondNumber) + ' ' + ConversionEngine.convertDistanceStringToMetric(label);
        });
        text = text.replace(/([0-9]+)([\W\D\S]|&nbsp;| cubic ){1,2}(feet|inch|foot|ft\.)/g, (_0, number: string, separator: string, label: string) => {
            return ConversionEngine.convertDistanceFromFeetToMeters(number) + separator + ConversionEngine.convertDistanceStringToMetric(label);
        });
        text = text.replace(/([0-9]+)(&nbsp;| |-)(pounds|lb|pound)/g, (_0, number: string, separator: string, label: string) => {
            return ConversionEngine.convertWeightFromPoundsToKilograms(number) + " " + ConversionEngine.convertWeightStringToKilograms(label)
        })
        return text;
    }

    private numberWordsReplacer(text: string): string {
        text = text.replace(/(\w+ )?(\w+)([ -])(feet|foot)/g, (_0, wordNumber1, wordNumber2, separator, unit) => {
            return numberSelecter(wordNumber1 ? wordNumber1?.toLowerCase().replace(' ', '') : '', wordNumber2?.toLowerCase()) + separator + unit
        })
        return text;
    }

    /**
     * Converts all the items and spells from an actor
     *
     * @param items - items array to be converted (can be found at actor.data.items)
     */
    private async _itemsConverter(items: Array<any>): Promise<void> {
        for (const item of items) await this.itemUpdater(item);
    }

    /**
     * Converts the speed to metric
     *
     * @param speed - speed + special speed object as found on the actor object
     */
    private _speedConverter(speed: any): any {
        if (!ConversionEngine.isMetric(speed.units)) return speed;

        const units = speed.units;
        Object.keys(speed).forEach((key) => {
            if (key == 'units') return;

            ConversionEngine.convertDistanceFromImperialToMetric(speed[key], units);
        })
        speed.units = ConversionEngine.convertDistanceStringToMetric(speed.units);

        return speed;
    }

    /**
     * Converts the items, senses and speeds of an actor to metric
     *
     * @param data -  actor data to be converted (can be found at actor.data)
     * @param actor - actor object for setting flags
     */
    private async _toMetricConverter5e(data: any, actor: any): Promise<any> {
        data.data.attributes.movement = this._speedConverter(data.data.attributes.movement);
        data.data.traits.senses = ConversionEngine.imperialReplacer(data.data.traits.senses, /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)

        return data;
    }

    /**
     * Main function for updating a specific actor
     *
     * @param actor - actor to be converted
     */
    public async actorUpdater(actor: any) {
        const actorClone = await actor.object.clone({_id: actor.object.data._id}, {temporary: true});

        actorClone.data = await this._toMetricConverter5e(actorClone.data, actor.object);

        await actor.object.update(actorClone.data);

        await this._itemsConverter(actor.object.items.entries);
    }


    /**
     * Main function for updating a specific item
     *
     * @param item - item to be converted
     */
    public async itemUpdater(item: any) {
        if (item.getFlag("Foundry-MGL", "converted")) return;
        const itemClone = await item.clone({}, {temporary: true})

        itemClone.data.data.description.value = this._convertText(itemClone.data.data.description.value);

        itemClone.data.data.target = this._convertDistance(itemClone.data.data.target);
        itemClone.data.data.range = this._convertDistance(itemClone.data.data.range);
        itemClone.data.data.weight = ConversionEngine.convertWeightFromPoundsToKilograms(itemClone.data.data.weight);

        if (item.labels) item.labels.range = this._labelConverter(item.labels.range);

        await item.setFlag("Foundry-MGL", "converted", true);
        await item.update(itemClone.data);
    }

    public async journalUpdater(journal) {
        const journalClone = await journal.clone({}, {temporary: true});

        journalClone.data.content = this.numberWordsReplacer(journalClone.data.content);
        journalClone.data.content = this._convertText(journalClone.data.content);

        await journal.update(journalClone.data);
    }
}

export default Dnd5eConverter.getInstance();