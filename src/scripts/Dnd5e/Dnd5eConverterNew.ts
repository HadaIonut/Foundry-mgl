import {
    actorDataConverter, convertDistance,
    convertStringFromImperialToMetric, convertText,
    convertValueToMetric, labelConverter,
} from "../Utils/ConversionEngineNew";

import {createErrorMessage} from "../Utils/ErrorHandler";
import {createNewCompendium, relinkCompendiums, typeSelector} from "./Compendium5eConverter";
import Utils from "../Utils/Utils";

const itemUpdater = async (item: any, onlyLabel?: boolean): Promise<void> => {
    if (item.getFlag("Foundry-MGL", "converted")) return;
    const itemClone = JSON.parse(JSON.stringify(item));

    if (!onlyLabel) itemClone.data.description.value = convertText(itemClone.data.description.value);
    if (!onlyLabel) itemClone.data.weight = convertValueToMetric(itemClone.data.weight, 'pound');

    itemClone.data.target = convertDistance(itemClone.data.target);
    itemClone.data.range = convertDistance(itemClone.data.range);

    if (item.labels.range) item.labels.range = labelConverter(item.labels.range);

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

const itemsUpdater = async (items: Array<any>, onlyLabel?: boolean): Promise<void> => {
    for (const item of items) await itemUpdater(item, onlyLabel);
}

const actorUpdater = async (actor: any, onlyLabel?: boolean): Promise<void> => {
    const actorClone = JSON.parse(JSON.stringify(actor));

    actorClone.data = actorDataConverter(actorClone.data);

    try {
        await actor.update(actorClone);
    } catch (e) {
        createErrorMessage(e, 'actor.update', actorClone.data);
    }

    await itemsUpdater(actor.items.entries, onlyLabel);
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

const rollTableUpdater = async (rollTable: any): Promise<void> => {
    const rollTableClone = JSON.parse(JSON.stringify(rollTable));

    if (rollTableClone.description) rollTableClone.description = convertText(rollTableClone.description);
    rollTableClone.results.forEach((result) => {
        result.text = convertText(result.text)
    })

    try {
        await rollTable.update(rollTableClone);
    } catch (e) {
        createErrorMessage(e, rollTableClone.name, rollTableClone);
    }
}

const compendiumUpdater = async (compendium: string, onlyLabel?: boolean): Promise<void> => {
    try {
        const pack = game.packs.get(compendium);
        await pack.getIndex();
        const newPack = await createNewCompendium(pack.metadata);
        const newEntitiesArray = [];

        const loadingBar = Utils.loading(`Converting compendium ${pack.metadata.label}`)(0)(pack.index.length - 1);
        for (const index of pack.index) {
            const entity = await pack.getEntity(index._id);
            let entityClone = JSON.parse(JSON.stringify(entity.data))
            entityClone = typeSelector(entityClone, entity.constructor.name, onlyLabel);
            newEntitiesArray.push(entityClone);
            loadingBar();
        }
        newPack.createEntity(newEntitiesArray);
    } catch (e) {
        createErrorMessage(e, 'compendiumUpdater', compendium);
    }

}

const batchCompendiumUpdater = (compendiums: string[]) => async () => {
    for (const compendium of compendiums)
        if (!compendium.includes('metrified')) await compendiumUpdater(compendium);
    await relinkCompendiums();
}

export {actorUpdater, itemUpdater, journalUpdater, rollTableUpdater, compendiumUpdater, allScenesUpdater, batchCompendiumUpdater}