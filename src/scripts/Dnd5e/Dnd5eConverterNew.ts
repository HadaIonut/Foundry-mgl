import {
    actorDataConverter, actorTokenConverter, convertDistance,
    convertStringFromImperialToMetric, convertText,
    convertValueToMetric, labelConverter,
} from "../Utils/ConversionEngineNew";

import {createErrorMessage} from "../Utils/ErrorHandler";
import {createNewCompendium, createNewCompendiumMeta, relinkCompendiums, typeSelector} from "./Compendium5eConverter";
import Utils from "../Utils/Utils";

const itemUpdater = async (item: any, onlyLabel?: boolean, onlyUnit?:boolean): Promise<void> => {
    if (item.getFlag("Foundry-MGL", "converted")) return;
    const itemClone = JSON.parse(JSON.stringify(item));

    if (!onlyLabel) itemClone.data.description.value = convertText(itemClone.data.description.value);
    if (!onlyLabel) itemClone.data.weight = convertValueToMetric(itemClone.data.weight, 'pound');

    itemClone.data.target = convertDistance(itemClone.data.target, onlyUnit);
    itemClone.data.range = convertDistance(itemClone.data.range, onlyUnit);

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

const itemsUpdater = async (items: Array<any>, onlyLabel?: boolean, onlyUnit?:boolean): Promise<void> => {
    for (const item of items) await itemUpdater(item, onlyLabel, onlyUnit);
}

const actorUpdater = async (actor: any, onlyLabel?: boolean, onlyUnit?:boolean): Promise<void> => {
    const actorClone = JSON.parse(JSON.stringify(actor));

    if (!actor.getFlag("Foundry-MGL", "converted")) {
        actorClone.data = actorDataConverter(actorClone.data);
        actorClone.token = actorTokenConverter(actorClone.token);
    }

    try {
        await actor.update(actorClone);
        await actor.setFlag("Foundry-MGL", "converted", true);
    } catch (e) {
        createErrorMessage(e, 'actor.update', actorClone.data);
    }

    await itemsUpdater(actor.items, onlyLabel, onlyUnit)
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

const compendiumUpdater = async (compendium: any, onlyLabel?: boolean, onlyUnit?:boolean): Promise<void> => {
    try {
        const pack = game.packs.get(compendium.collection);
        await pack.getIndex();
        const newPack = await pack.duplicateCompendium({
            label: `${pack.metadata.label} Metrified`
        })
        await newPack.getIndex();

        const loadingBar = Utils.loading(`Converting compendium ${pack.metadata.label}`)(0)(pack.index.size - 1);
        for (const index of newPack.index) {
            try {
                const entity = await newPack.getDocument(index._id);
                let entityClone = JSON.parse(JSON.stringify(entity.data));

                entityClone = typeSelector(entityClone, entity.constructor.name, onlyLabel, onlyUnit);

                await entity.update(entityClone);

                loadingBar();
            }
            catch (e) {
                createErrorMessage(e, 'compendiumUpdater', compendium);
            }
        }

    } catch (e) {
        createErrorMessage(e, 'compendiumUpdater', compendium);
    }

}

const compendiumUpdaterNew = async (compendium: any, onlyLabel?: boolean, onlyUnit?:boolean): Promise<void> => {
    try {
        const pack = game.packs.get(compendium.collection);
        await pack.getIndex();
        const newPack = await pack.duplicateCompendium(`${pack.metadata.label} Metrified`);
        await newPack.getIndex();

        const loadingBar = Utils.loading(`Converting compendium ${pack.metadata.label}`)(0)(pack.index.size - 1);
        newPack.forEach(() => {
            console.log('document');
        })
    } catch (e) {
        createErrorMessage(e, 'compendiumUpdater', compendium);
    }
}

const batchCompendiumUpdater = (compendiums: string[]) => async () => {
    for (const compendium of compendiums)
        if (!compendium.includes('metrified')) await compendiumUpdater(compendium);
    await relinkCompendiums();
}

export {actorUpdater, itemUpdater, journalUpdater, rollTableUpdater, compendiumUpdater, allScenesUpdater, batchCompendiumUpdater, compendiumUpdaterNew}