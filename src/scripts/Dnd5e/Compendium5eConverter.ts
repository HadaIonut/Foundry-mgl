import {
    actorDataConverter, actorTokenConverter,
    convertDistance,
    convertStringFromImperialToMetric,
    convertText,
    convertValueToMetric, relinkText
} from "../Utils/ConversionEngineNew";
import Utils from "../Utils/Utils";

const itemUpdater = (item: any, onlyLabel?: boolean, onlyUnit?:boolean): any => {
    if (!onlyLabel) item.data.description.value = convertText(item.data.description.value);
    if (!onlyLabel) item.data.weight = convertValueToMetric(item.data.weight, 'pound');

    item.data.target = convertDistance(item.data.target, onlyUnit);
    item.data.range = convertDistance(item.data.range, onlyUnit);

    return item;
}

const itemsUpdater = (items: any[], onlyLabel?: boolean, onlyUnit?:boolean): any[] => {
    for (let i = 0; i < items.length; i++) {
        items[i] = itemUpdater(items[i], onlyLabel, onlyUnit);
    }
    return items;
}

const actorUpdater = (actor: any, onlyLabel?: boolean, onlyUnit?:boolean): any => {
    actor.data = actorDataConverter(actor.data);
    actor.token = actorTokenConverter(actor.token);
    actor.items = itemsUpdater(actor.items, onlyLabel, onlyUnit);
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

const typeSelector = (entity: any, type: string, onlyLabel?: boolean, onlyUnit?:boolean): any => {
    switch (type) {
        case 'Actor5e':
            return actorUpdater(entity, onlyLabel, onlyUnit);
        case 'Mars5eActor':
            return actorUpdater(entity, onlyLabel, onlyUnit);
        case 'Item5e':
            return itemUpdater(entity, onlyLabel, onlyUnit);
        case 'MarsItem5e':
            return itemUpdater(entity, onlyLabel, onlyUnit);
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
    // @ts-ignore
    return await CompendiumCollection.createCompendium({
        entity: metadata.entity,
        label: `${metadata.label} Metrified`,
        name: `${metadata.name}-metrified`,
        package: 'Foundry-MGL',
        path: `./packs/${metadata.name}-metrified.db`,
        system: "dnd5e"
    })
}

const createNewCompendiumMeta = (metadata: any) => {
    // @ts-ignore
    return {
        entity: metadata.entity,
        label: `${metadata.label} Metrified`,
        name: `${metadata.name}-metrified`,
        package: 'Foundry-MGL',
        path: `./packs/${metadata.name}-metrified.db`,
        system: "dnd5e"
    };
}


const relinkTypeSelector = async (entity, type, cache) => {
    switch (type) {
        case 'Actor5e':
            for (const item in entity.items) {
                if (!entity.items.hasOwnProperty(item)) continue;
                entity.items[item].data.description.value = await relinkText(entity.items[item].data.description.value, cache)
            }
            return entity;
        case 'Item5e':
            entity.data.description.value = await relinkText(entity.data.description.value, cache)
            return entity;
        case 'JournalEntry':
            entity.content = await relinkText(entity.content, cache);
            return entity;
        default:
            return entity;
    }
}

const relinkCompendium = async (compendium, cache) => {
    const sourcePack = game.packs.get(compendium);
    await sourcePack.getIndex();

    const loadingBar = Utils.loading(`Relinking compendium ${sourcePack.metadata.label}`)(0)(sourcePack.index.size - 1);
    for (const index of sourcePack.index) {
        const entity = await sourcePack.getEntity(index._id);
        let entityClone = JSON.parse(JSON.stringify(entity.data))
        entityClone = await relinkTypeSelector(entityClone, entity.constructor.name, cache);
        await sourcePack.updateEntity(entityClone);
        loadingBar();
    }
}

const relinkCompendiums = async () => {
    const compendiums = game.packs.keys();
    const cache = Utils.cache();
    for (const compendium of compendiums)
        if (compendium.includes('metrified')) await relinkCompendium(compendium, cache);
}


export {typeSelector, createNewCompendium, relinkCompendiums, relinkCompendium, createNewCompendiumMeta}