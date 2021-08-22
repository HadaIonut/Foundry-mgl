import {DND5E} from "../../../systems/dnd5e/module/config.js";
import {getSetting, registerSettings} from "./Settings.js";
import {
    onCompendiumRender,
    onRenderActorSheet,
    onRenderItemSheet,
    onRenderJurnalSheet,
    onRenderRollTable,
    onRenderSideBar
} from "./MetricModule.js";
import {consoleLog} from "./Utils/Utils.js";

/**
 * Defines distance units and sets encumbrance
 */
Hooks.on('init', () => {
    consoleLog("Changing labels 'Feet' and 'Miles' to 'Meters' and 'Kilometers'.")
    DND5E.distanceUnits["m"] = game.i18n.localize("metricsystem.meters");
    DND5E.distanceUnits["km"] = game.i18n.localize("metricsystem.kilometers");
    consoleLog("Changing encumbrance calculation.")
    DND5E.encumbrance["currencyPerWeight"] = 100;
    DND5E.encumbrance["strMultiplier"] = 7.5;

    registerSettings();
});

/**
 * Changes labels from lbs. to kg.
 */
Hooks.on('ready', () => {
    consoleLog("Changing label 'lbs.' to 'kg'.");
    game.i18n.translations.DND5E["AbbreviationLbs"] = 'kg';
});

/**
 * Makes default scene settings to be converted
 */
Hooks.on('createScene', (scene) => {
    const gridDist = getSetting("sceneGridDistance");
    const gridUnits = getSetting("sceneGridUnits");
    if (!getSetting("sceneConversion")) return;
    consoleLog(`New Scene: changing gridUnits to '${gridUnits}' and gridDistance to '${gridDist}'.`);
    const sceneClone = JSON.parse(JSON.stringify(scene));

    sceneClone.gridDistance = gridDist;
    sceneClone.gridUnits = gridUnits;
    scene.update(sceneClone)
})


Hooks.on('renderActorSheet', onRenderActorSheet);

Hooks.on('renderItemSheet', onRenderItemSheet);

Hooks.on('renderJournalSheet', onRenderJurnalSheet);

Hooks.on("renderSidebarTab", onRenderSideBar);

Hooks.on('renderRollTableConfig', onRenderRollTable);

Hooks.on('renderCompendium', onCompendiumRender)
