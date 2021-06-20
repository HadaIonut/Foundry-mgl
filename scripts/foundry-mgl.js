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
import {convertStringFromImperialToMetric, convertText, convertValueToMetric} from "./Utils/ConversionEngineNew.js";

/**
 * Defines distance units and sets encumbrance
 */
Hooks.on('init', () => {
    CONFIG.debug.hooks = true;
    consoleLog("Changing labels 'Feet' and 'Miles' to 'Meters' and 'Kilometers'.")
    DND5E.distanceUnits["m"] = game.i18n.localize("metricsystem.meters");
    DND5E.distanceUnits["km"] = game.i18n.localize("metricsystem.kilometers");
    consoleLog("Changing encumbrance calculation.")
    DND5E.encumbrance["currencyPerWeight"] = 100;
    DND5E.encumbrance["strMultiplier"] = 7.5;

    registerSettings();
});

const convertTranslations = (text) => {
    text = convertText(text);
    text = convertStringFromImperialToMetric(text);
    return text;
}

const addNewTranslationsForMetric = (object, prop) => {
    const match = prop.match(/Trait([A-Za-z]+)([0-9]+)/);
    if (match) {
        const newProp = `Trait${match[1]}${convertValueToMetric(match[2], 'ft')}`;
        object[newProp] = object[prop];
    }
    const weaponMatch = prop.match(/WeaponRange([0-9]+)/);
    if (weaponMatch) {
        const newProp = `WeaponRange${convertValueToMetric(weaponMatch[1], 'ft')}`;
        object[newProp] = object[prop];
    }
}

const convertI18NObject = (obj) => {
    for (const prop in obj) {
        const value = obj[prop];
        if (typeof value === 'string') {
            obj[prop] = convertTranslations(obj[prop]);
            addNewTranslationsForMetric(obj, prop);
        }
        else {
            convertI18NObject(value);
        }
    }
}

/**
 * Changes labels from lbs. to kg.
 */
Hooks.on('ready', () => {
    consoleLog("Changing label 'lbs.' to 'kg'.");
    if (game.system.id === 'dnd5e') game.i18n.translations.DND5E["AbbreviationLbs"] = 'kg';

    if (game.system.id === 'pf2e') convertI18NObject(game.i18n.translations.PF2E);
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
