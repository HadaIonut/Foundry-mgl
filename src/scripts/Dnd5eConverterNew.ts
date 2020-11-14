import {
    actorDataConverter, convertDistance,
    convertStringFromImperialToMetric, convertText,
    convertValueToMetric, labelConverter,
} from "./ConversionEngineNew";

import {createErrorMessage} from "./ErrorHandler";
import {createNewCompendium, typeSelector} from "./Compendium5eConverter";

const itemUpdater = async (item: any): Promise<void> => {
    if (item.getFlag("Foundry-MGL", "converted")) return;
    const itemClone = JSON.parse(JSON.stringify(item));

    itemClone.data.description.value = convertText(itemClone.data.description.value);

    itemClone.data.target = convertDistance(itemClone.data.target);
    itemClone.data.range = convertDistance(itemClone.data.range);
    itemClone.data.weight = convertValueToMetric(itemClone.data.weight, 'pound');

    if (item.labels) item.labels.range = labelConverter(item.labels.range);

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

const itemsUpdater = async (items: Array<any>): Promise<void> => {
    for (const item of items) await itemUpdater(item);
}

const actorUpdater = async (actor: any): Promise<void> => {
    const actorClone = JSON.parse(JSON.stringify(actor));

    actorClone.data = actorDataConverter(actorClone.data);

    try {
        await actor.update(actorClone.data);
    } catch (e) {
        createErrorMessage(e, 'actor.update', actorClone.data);
    }

    await itemsUpdater(actor.items.entries);
}

const journalUpdater = async (journal: any): Promise<void> => {
    const journalClone = JSON.parse(JSON.stringify(journal));

    journalClone.content = convertText(journalClone.content);

    try {
        await journal.update(journalClone);
    } catch (e) {
        createErrorMessage(e, journalClone.name, journal);
    }

}

const allScenesUpdater = async (): Promise<void> => {
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

const rollTableConverter = async (rollTable: any): Promise<void> => {
    const rollTableClone = JSON.parse(JSON.stringify(rollTable));

    rollTableClone.description = convertText(rollTableClone.description);
    rollTableClone.results.forEach((result) => {
        result.text = convertText(result.text)
    })

    try {
        await rollTable.update(rollTableClone);
    } catch (e) {
        createErrorMessage(e, rollTableClone.name, rollTableClone);
    }
}

const compendiumConverter = async (compendium: string): Promise<void> => {
    const pack = game.packs.get(compendium);
    await pack.getIndex();
    const newPack = await createNewCompendium(pack.metadata);
    const newEntitiesArray = [];

    const loading = this._loading(`Converting compendium ${pack.metadata.label}`)(0)(pack.index.length - 1);
    for (const index of pack.index) {
        const entity = await pack.getEntity(index._id);
        let entityClone = JSON.parse(JSON.stringify(entity.data))
        entityClone = typeSelector(entityClone, entity.constructor.name);
        newEntitiesArray.push(entityClone);
        loading();
    }
    newPack.createEntity(newEntitiesArray);
}