import {numberSelector, numberToWords} from "./WordsToNumbers";
import {
    convertValueToMetric,
    convertStringFromImperialToMetric,
    isMetric,
    imperialReplacer
} from "./ConversionEngineNew";
import Settings from "./Settings";

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
        const unit = convertStringFromImperialToMetric(matchedLabel.unit);
        let convertedLabel = '';

        if (!unit) return label;
        if (unit === 'Meters' || unit === 'm') {
            if (matchedLabel.valueOpt)
                convertedLabel += convertValueToMetric(matchedLabel.valueOpt, matchedLabel.unit) + ' /';
            convertedLabel += convertValueToMetric(matchedLabel.value, matchedLabel.unit) + ' ' + unit;
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
        distance.value = convertValueToMetric(distance.value, distance.units);
        if (distance?.long)
            distance.long = convertValueToMetric(distance.long, distance.units);

        distance.units = convertStringFromImperialToMetric(distance.units);

        return distance;
    }

    /**
     * Converts text containing imperial units to metric
     *
     * @param text - text containing imperial units
     */
    private _convertText(text: string): string {
        return text.replace(/(\b[^\d\W]+\b )?(\b[^\d\W]+\b)([ -])(feet|foot)/g, (_0, wordNumber1, wordNumber2, separator, unit) => {
            const selectedNumber = numberSelector(wordNumber1 ? wordNumber1?.toLowerCase().replace(' ', '') : '', wordNumber2?.toLowerCase());
            if (selectedNumber.number) {
                const convertedValue = convertValueToMetric(selectedNumber.number, unit);
                return selectedNumber.text + numberToWords(Math.ceil(Number(convertedValue))) + separator + convertStringFromImperialToMetric(unit);
            }
            return selectedNumber.text + separator + unit;
        }).replace(/([0-9]+) (to|and) ([0-9]+) (feet|inch|foot|ft\.)/g, (_0, number1, separatorWord, number2, units) => {
            return convertValueToMetric(number1, units) + ` ${separatorWord} ` + convertValueToMetric(number2, units) + ` ${convertStringFromImperialToMetric(units)}`;
        }).replace(/([0-9]{1,3}(,[0-9]{3})+)([ -])(feet|foot|pounds)/g, (_0, number: string, _1, separator, label: string) => {
            return convertValueToMetric(number, label) + separator + convertStringFromImperialToMetric(label);
        }).replace(/([0-9]+)\/([0-9]+) (feet|inch|foot|ft\.)/g, (_0, firstNumber: string, secondNumber: string, label: string) => {
            return convertValueToMetric(firstNumber, label) + '/' + convertValueToMetric(secondNumber, label) + ' ' + convertStringFromImperialToMetric(label);
        }).replace(/([0-9]+)([\W\D\S]|&nbsp;| cubic |-){1,2}(feet|inch|foot|ft\.|pounds|lbs\.|pound|lbs|lb)/g, (_0, number: string, separator: string, label: string) => {
            return convertValueToMetric(number, label) + separator + convertStringFromImperialToMetric(label);
        }).replace(/(several \w+ )(feet|yards)/g, (_0, several, unit) => {
            return several + convertStringFromImperialToMetric(unit);
        })
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
    private _movementConverter(speed: any): any {
        if (!isMetric(speed.units)) return speed;

        const units = speed.units;
        Object.keys(speed).forEach((key) => {
            if (key === 'units' || key === 'hover') return;

            speed[key] = convertValueToMetric(speed[key], units);
        })
        speed.units = convertStringFromImperialToMetric(speed.units);

        return speed
    }

    /**
     * This method does the exact same thing as the one above but atropos changed how movement works so now i dont know
     * what structure i should use, so i did the most sensible thing
     *
     * I metrified all of them just to be sure
     *
     * @param speed
     * @private
     */
    private _speedConverter (speed:any) {
        speed.value = this._convertText(speed.value);
        speed.special = this._convertText(speed.special);
        return speed;
    }

    /**
     * Converts the items, senses and speeds of an actor to metric
     *
     * @param data -  actor data to be converted (can be found at actor.data)
     */
    private async _toMetricConverter5e(data: any): Promise<any> {
        data.data.attributes.movement = this._movementConverter(data.data.attributes.movement);
        if (data.data.attributes.speed)
            data.data.attributes.speed = this._speedConverter(data.data.attributes.speed);
        data.data.traits.senses = imperialReplacer(data.data.traits.senses || '', /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)

        return data;
    }

    /**
     * Main function for updating a specific actor
     *
     * @param actor - actor to be converted
     */
    public async actorUpdater(actor: any) {
        const actorClone = await actor.clone({_id: actor.data._id}, {temporary: true});

        actorClone.data = await this._toMetricConverter5e(actorClone.data);

        await actor.update(actorClone.data);

        await this._itemsConverter(actor.items.entries);
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
        itemClone.data.data.weight = convertValueToMetric(itemClone.data.data.weight, 'pound');

        if (item.labels) item.labels.range = this._labelConverter(item.labels.range);

        await item.setFlag("Foundry-MGL", "converted", true);
        await item.update(itemClone.data);
    }

    /**
     * Converts a specific journal entry to metric
     *
     * @param journal
     */
    public async journalUpdater(journal) {
        const journalClone = await journal.clone({}, {temporary: true});

        journalClone.data.content = this._convertText(journalClone.data.content);

        await journal.update(journalClone.data);
    }

    /**
     * Batch conversion of all the scenes (except the viewed one)
     *
     */
    public async allScenesUpdater() {
        for (const scene of game.scenes.entities) {
            // @ts-ignore
            if (scene._view === true) continue;
            const sceneClone = await scene.clone({}, {temporary: true});
            // @ts-ignore
            sceneClone.data.gridDistance = Settings.getSetting('sceneGridDistance');
            // @ts-ignore
            sceneClone.data.gridUnits = Settings.getSetting('sceneGridUnits');

            await scene.update(sceneClone.data);
        }
    }

    /**
     * Converts a rolltable
     *
     * @param rollTable
     */
    public async rollTableConverter(rollTable) {
        const rollTableClone = await rollTable.clone({}, {temporary: true});

        rollTableClone.data.description = this._convertText(rollTableClone.data.description);
        rollTableClone.data.results.forEach((result) => {
            result.text = this._convertText(result.text)
        })

        await rollTable.update(rollTableClone.data);
    }

    /**
     * Converts an item from a compendium
     *
     * @param item
     * @private
     */
    private _compendiumItemUpdater(item) {
        item.data.description.value = this._convertText(item.data.description.value);

        item.data.target = this._convertDistance(item.data.target);
        item.data.range = this._convertDistance(item.data.range);
        item.data.weight = convertValueToMetric(item.data.weight, 'pound');

        return item;
    }

    /**
     * Converts a list of items from the compendium
     *
     * @param items
     * @private
     */
    private _compendiumItemsUpdater(items) {
        for (let i = 0; i < items.length; i++) {
            items[i] = this._compendiumItemUpdater(items[i]);
        }
        return items;
    }

    /**
     * Converts an actor from compendium
     *
     * @param actor
     * @private
     */
    private async _compendiumActorUpdater(actor) {
        actor.data = await this._toMetricConverter5e(actor.data);
        actor.data.items = this._compendiumItemsUpdater(actor.data.items);
        return actor;
    }

    /**
     * Selects what type of entity the current target is
     *
     * @param entity
     */
    public async typeSelector(entity) {
        switch (entity.constructor.name) {
            case 'Actor5e':
                return await this._compendiumActorUpdater(entity);
            case 'Item5e':
                entity.data = await this._compendiumItemUpdater(entity.data);
                return entity;
            case 'JournalEntry':
                entity.data.content = this._convertText(entity.data.content);
                return entity;
            default:
                return entity;
        }
    }

    /**
     * Creates a new compendium from a given metadata
     *
     * @param metadata - metadata of the owner compendium
     * @private
     */
    private async _createANewCompendiumFromMeta(metadata) {
        return await Compendium.create({
            entity: metadata.entity,
            label: `${metadata.label} Metrified`,
            name: `${metadata.label}-metrified`,
            package: 'Foundry-MGL',
            path: `./packs/${metadata.label}-metrified.db`,
            system: "dnd5e"
        })
    }

    public async compendiumConverter(compendium) {
        const pack = game.packs.get(compendium);
        await pack.getIndex();
        const newPack = await this._createANewCompendiumFromMeta(pack.metadata);

        for (const index of pack.index) {
            const entity = await pack.getEntity(index._id);
            let entityClone = await entity.clone({}, {temporary: true});
            entityClone = await this.typeSelector(entityClone);
            await newPack.createEntity(entityClone.data)
        }
    }

    public async batchCompendiumConverter() {
        ui.notifications.warn('Batch conversion for the compendiums has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        // @ts-ignore
        for (const entry of game.packs.entries)
            if (!entry.metadata.name.includes('metrified')) await this.compendiumConverter(entry.collection);

        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchActorConverter() {
        ui.notifications.warn('Batch conversion for the actors has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        const actors = game.actors.entities;
        for (const actor of actors) await this.actorUpdater(actor);
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchItemsConverter(items) {
        ui.notifications.warn('Batch conversion for the items has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        for (const item of items) await this.itemUpdater(item);
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchRolltablesConverter () {
        ui.notifications.warn('Batch conversion for the rollable tables has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        for (const rollTable of game.tables.entities) await this.rollTableConverter(rollTable);
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchJournalsConverter () {
        ui.notifications.warn('Batch conversion for the journal entries has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        for (const journal of game.journal.entities) await this.journalUpdater(journal);
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }
}

export default Dnd5eConverter.getInstance();