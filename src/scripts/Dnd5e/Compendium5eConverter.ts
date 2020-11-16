import {
    actorDataConverter,
    convertDistance,
    convertStringFromImperialToMetric,
    convertText,
    convertValueToMetric, relinkText
} from "../Utils/ConversionEngineNew";

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
        name: `${metadata.name}-metrified`,
        package: 'Foundry-MGL',
        path: `./packs/${metadata.name}-metrified.db`,
        system: "dnd5e"
    })
}

const relinkCompendium = async (compendium) => {
    const sourcePack = game.packs.get(compendium);
    await sourcePack.getIndex();

    for (const index of sourcePack.index) {
        const entity = await sourcePack.getEntity(index._id);
        let entityClone = JSON.parse(JSON.stringify(entity.data))
        if (entity.constructor.name === 'JournalEntry'){
            entityClone.content = await relinkText(entityClone.content);
            await sourcePack.updateEntity(entityClone);
        }

    }
}

const relinkCompendiums = async () => {
    const compendiums = game.packs.keys();
    for (const compendium of compendiums)
        if (compendium.includes('metrified')) await relinkCompendium(compendium);
}


export {typeSelector, createNewCompendium, relinkCompendiums}