import {numberSelector, numberToWords} from "./WordsToNumbers";
import {
    convertValueToMetric,
    convertStringFromImperialToMetric,
    isMetric,
    imperialReplacer
} from "./ConversionEngineNew";
import {createErrorMessage} from "./ErrorHandler";
import Utils from "./Utils";

class Dnd5eConverter {
    private static _instance: Dnd5eConverter;
    private _loading;

    private constructor() {
        this._loading = Utils.loading;
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
            const capitalized = wordNumber1 !== wordNumber1?.toLowerCase();
            const selectedNumber = numberSelector(wordNumber1 ? wordNumber1?.toLowerCase().replace(' ', '') : '', wordNumber2?.toLowerCase());
            if (selectedNumber.number) {
                const convertedValue = convertValueToMetric(selectedNumber.number, unit);
                const returnText = selectedNumber.text + numberToWords(Math.ceil(Number(convertedValue))) + separator + convertStringFromImperialToMetric(unit);
                return capitalized ? returnText.charAt(0).toUpperCase() + returnText.slice(1) : returnText;
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
    private _speedConverter(speed: any) {
        speed.value = this._convertText(speed.value || '');
        speed.special = this._convertText(speed.special || '');
        return speed;
    }

    /**
     * Converts the items, senses and speeds of an actor to metric
     *
     * @param data -  actor data to be converted (can be found at actor.data)
     */
    private _toMetricConverter5e(data: any): any {
        data.attributes.movement = this._movementConverter(data.attributes.movement);
        if (data.attributes.speed)
            data.attributes.speed = this._speedConverter(data.attributes.speed);
        data.traits.senses = imperialReplacer(data.traits.senses || '', /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)

        return data;
    }

    /**
     * Main function for updating a specific actor
     *
     * @param actor - actor to be converted
     */
    public async actorUpdater(actor: any): Promise<void> {
        const actorClone = JSON.parse(JSON.stringify(actor))

        actorClone.data = this._toMetricConverter5e(actorClone.data);

        try {
            await actor.update(actorClone.data);
        } catch (e) {
            createErrorMessage(e, 'actor.update', actorClone.data);
        }

        await this._itemsConverter(actor.items.entries);
    }

    /**
     * Main function for updating a specific item
     *
     * @param item - item to be converted
     */
    public async itemUpdater(item: any) {
        if (item.getFlag("Foundry-MGL", "converted")) return;
        const itemClone = JSON.parse(JSON.stringify(item));

        itemClone.data.description.value = this._convertText(itemClone.data.description.value);

        itemClone.data.target = this._convertDistance(itemClone.data.target);
        itemClone.data.range = this._convertDistance(itemClone.data.range);
        itemClone.data.weight = convertValueToMetric(itemClone.data.weight, 'pound');

        if (item.labels) item.labels.range = this._labelConverter(item.labels.range);

        try {
            await item.setFlag("Foundry-MGL", "converted", true);
        } catch (e) {
            createErrorMessage(e, `${itemClone.name}.setFlag()`, item);
        }
        try {
            await item.update(itemClone);
        } catch (e) {
            createErrorMessage(e, `${itemClone.name}.update`, itemClone);
        }
    }

    /**
     * Converts a specific journal entry to metric
     *
     * @param journal
     */
    public async journalUpdater(journal) {
        const journalClone = JSON.parse(JSON.stringify(journal));

        journalClone.content = this._convertText(journalClone.content);

        try {
            await journal.update(journalClone);
        } catch (e) {
            createErrorMessage(e, journalClone.name, journal);
        }

    }

    /**
     * Batch conversion of all the scenes (except the viewed one)
     *
     */
    public async allScenesUpdater() {
        for (const scene of game.scenes.entities) {
            // @ts-ignore
            if (scene._view === true) continue;
            const sceneClone = JSON.parse(JSON.stringify(scene));
            // @ts-ignore
            sceneClone.gridDistance = convertValueToMetric(sceneClone.gridDistance, sceneClone.gridUnits);
            // @ts-ignore
            sceneClone.gridUnits = convertStringFromImperialToMetric(sceneClone.gridUnits);

            try {
                await scene.update(sceneClone);
            } catch (e) {
                createErrorMessage(e, sceneClone.name, sceneClone);
            }

        }
    }

    /**
     * Converts a rolltable
     *
     * @param rollTable
     */
    public async rollTableConverter(rollTable) {
        const rollTableClone = JSON.parse(JSON.stringify(rollTable));

        rollTableClone.description = this._convertText(rollTableClone.description);
        rollTableClone.results.forEach((result) => {
            result.text = this._convertText(result.text)
        })

        try {
            await rollTable.update(rollTableClone);
        } catch (e) {
            createErrorMessage(e, rollTableClone.name, rollTableClone);
        }
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
    private _compendiumActorUpdater(actor) {
        actor.data = this._toMetricConverter5e(actor.data);
        actor.data.items = this._compendiumItemsUpdater(actor.data.items);
        return actor;
    }

    private _compendiumRollTableUpdater(rollTable) {
        rollTable.name = this._convertText(rollTable.name);
        for (let index = 0; index < rollTable.results.length; index++)
            rollTable.results[index].text = this._convertText(rollTable.results[index].text)
        return rollTable;
    }

    private _compendiumScenesUpdater(scene) {
        scene.gridDistance = convertValueToMetric(scene.gridDistance, scene.gridUnits);
        scene.gridUnits = convertStringFromImperialToMetric(scene.gridUnits);
        return scene
    }

    /**
     * Selects what type of entity the current target is
     *
     * @param entity
     */
    public async typeSelector(entity) {
        switch (entity.constructor.name) {
            case 'Actor5e':
                return this._compendiumActorUpdater(entity);
            case 'Item5e':
                entity.data = this._compendiumItemUpdater(entity.data);
                return entity;
            case 'JournalEntry':
                entity.data.content = this._convertText(entity.data.content);
                return entity;
            case 'RollTable':
                entity.data = this._compendiumRollTableUpdater(entity.data);
                return entity;
            case 'Scene':
                entity.data = this._compendiumScenesUpdater(entity.data);
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
        const newEntitiesArray = [];

        const loading = this._loading(`Converting compendium ${pack.metadata.label}`)(0)(pack.index.length - 1);
        for (const index of pack.index) {
            const entity = await pack.getEntity(index._id);
            let entityClone = JSON.parse(JSON.stringify(entity.data))
            entityClone = await this.typeSelector(entityClone);
            newEntitiesArray.push(entityClone);
            loading();
        }
        await newPack.createEntity(newEntitiesArray);
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
        const loading = this._loading('Converting actors')(0)(actors.length - 1);
        for (const actor of actors) {
            await this.actorUpdater(actor);
            loading();
        }
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchItemsConverter(items) {
        ui.notifications.warn('Batch conversion for the items has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        const loading = this._loading(`Converting items`)(0)(items.length - 1);
        for (const item of items) {
            await this.itemUpdater(item);
            loading();
        }
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchRolltablesConverter() {
        ui.notifications.warn('Batch conversion for the rollable tables has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        const loading = this._loading(`Converting roll tables`)(0)(game.tables.entities.length - 1);
        for (const rollTable of game.tables.entities) {
            await this.rollTableConverter(rollTable);
            loading();
        }
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }

    public async batchJournalsConverter() {
        ui.notifications.warn('Batch conversion for the journal entries has started. This may take a while... Please don\'t do anything util completed.', {permanent: true})
        const loading = this._loading(`Converting journals`)(0)(game.journal.entities.length - 1);
        for (const journal of game.journal.entities) {
            await this.journalUpdater(journal);
            loading();
        }
        ui.notifications.info('Batch conversion completed, get back to the game', {permanent: true});
    }
}

export default Dnd5eConverter.getInstance();