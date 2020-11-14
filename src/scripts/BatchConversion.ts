import {
    actorDataConverter,
    convertDistance, convertStringFromImperialToMetric,
    convertText,
    convertValueToMetric,
    labelConverter
} from "./ConversionEngineNew";
import {createErrorMessage} from "./ErrorHandler";

const itemUpdater = (item: any): void => {
    if (item.getFlag("Foundry-MGL", "converted")) return;
    const itemClone = JSON.parse(JSON.stringify(item));

    itemClone.data.description.value = convertText(itemClone.data.description.value);

    itemClone.data.target = convertDistance(itemClone.data.target);
    itemClone.data.range = convertDistance(itemClone.data.range);
    itemClone.data.weight = convertValueToMetric(itemClone.data.weight, 'pound');

    if (item.labels) item.labels.range = labelConverter(item.labels.range);


    item.setFlag("Foundry-MGL", "converted", true)
        .then(() => item.update(itemClone)
            .catch((e) => createErrorMessage(e, `${itemClone.name}.update`, itemClone)))
        .catch((e) => createErrorMessage(e, `${itemClone.name}.setFlag()`, item))
}

const itemsUpdater = (items: any[]): void => {
    for (const item of items) itemUpdater(item);
}

const actorUpdater = (actor: any): void => {
    const actorClone = JSON.parse(JSON.stringify(actor));

    actorClone.data = actorDataConverter(actorClone.data);

    actor.update(actorClone.data)
        .then(() => itemsUpdater(actor.items.entries))
        .catch((e) => createErrorMessage(e, 'actor.update', actorClone.data))
}

const journalUpdater = (journal: any): void => {
    const journalClone = JSON.parse(JSON.stringify(journal));

    journalClone.content = convertText(journalClone.content);

    journal.update(journalClone).catch((e) => createErrorMessage(e, journalClone.name, journal))
}

const allScenesUpdater = (): void => {
    for (const scene of game.scenes.entities) {
        // @ts-ignore
        if (scene._view === true) continue;
        const sceneClone = JSON.parse(JSON.stringify(scene));
        // @ts-ignore
        sceneClone.gridDistance = convertValueToMetric(sceneClone.gridDistance, sceneClone.gridUnits);
        // @ts-ignore
        sceneClone.gridUnits = convertStringFromImperialToMetric(sceneClone.gridUnits);

        scene.update(sceneClone).catch((e) => createErrorMessage(e, sceneClone.name, sceneClone));
    }
}

const rollTableConverter = (rollTable: any): void => {
    const rollTableClone = JSON.parse(JSON.stringify(rollTable));

    rollTableClone.description = convertText(rollTableClone.description);
    rollTableClone.results.forEach((result) => {
        result.text = convertText(result.text)
    })

    rollTable.update(rollTableClone).catch((e) => createErrorMessage(e, rollTableClone.name, rollTableClone));
}

const batchConversion = (elements: any[], callbackFunction) => {

}