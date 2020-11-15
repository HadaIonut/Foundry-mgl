import {
    actorDataConverter,
    convertDistance,
    convertStringFromImperialToMetric,
    convertText,
    convertValueToMetric
} from "./ConversionEngineNew";

const itemUpdater = (item: any): any => {
    item.data.description.value = convertText(item.data.description.value);

    item.data.target = convertDistance(item.data.target);
    item.data.range = convertDistance(item.data.range);
    item.data.weight = convertValueToMetric(item.data.weight, 'pound');

    return item;
}

const itemsUpdater = (items: any[]): any[] => {
    for (let i = 0; i < items.length; i++) {
        items[i] = itemUpdater(items[i]);
    }
    return items;
}

const actorUpdater = (actor: any): any => {
    actor.data = actorDataConverter(actor.data);
    actor.items = itemsUpdater(actor.items);
    return actor;
}

const rollTableUpdater = (rollTable: any): any => {
    rollTable.name = convertText(rollTable.name);
    for (let index = 0; index < rollTable.results.length; index++)
        rollTable.results[index].text = convertText(rollTable.results[index].text)
    return rollTable;
}

const scenesUpdater = (scene: any): any => {
    scene.gridDistance = convertValueToMetric(scene.gridDistance, scene.gridUnits);
    scene.gridUnits = convertStringFromImperialToMetric(scene.gridUnits);
    return scene;
}

const typeSelector = (entity: any, type: string): any => {
    switch (type) {
        case 'Actor5e':
            return actorUpdater(entity);
        case 'Item5e':
            return itemUpdater(entity);
        case 'JournalEntry':
            entity.content = convertText(entity.content);
            return entity;
        case 'RollTable':
            return rollTableUpdater(entity);
        case 'Scene':
            return scenesUpdater(entity);
        default:
            return entity;
    }
}

const createNewCompendium = async (metadata: any): Promise<any> => {
    return Compendium.create({
        entity: metadata.entity,
        label: `${metadata.label} Metrified`,
        name: `${metadata.label}-metrified`,
        package: 'Foundry-MGL',
        path: `./packs/${metadata.label}-metrified.db`,
        system: "dnd5e"
    })
}

export {typeSelector, createNewCompendium}