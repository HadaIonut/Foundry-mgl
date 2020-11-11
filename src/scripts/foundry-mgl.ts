import Utils from "./Utils";
import MetricModule from "./MetricModule";
// @ts-ignore
import {DND5E} from "../../../systems/dnd5e/module/config.js";
import Settings from "./Settings";

const debug = Utils.debug.bind(Utils);

/**
 * Defines distance units and sets encumbrance
 */
Hooks.on('init', () => {
    debug("Changing labels 'Feet' and 'Miles' to 'Meters' and 'Kilometers'.")
    DND5E.distanceUnits["m"] = game.i18n.localize("metricsystem.meters");
    DND5E.distanceUnits["km"] = game.i18n.localize("metricsystem.kilometers");
    debug("Changing encumbrance calculation.")
    DND5E.encumbrance["currencyPerWeight"] = 100;
    DND5E.encumbrance["strMultiplier"] = 7.5;

    Settings.registerSettings();
});

/**
 * Changes labels from lbs. to kg.
 */
Hooks.on('ready', () => {
    debug("Changing label 'lbs.' to 'kg'.");
    // @ts-ignore
    game.i18n.translations.DND5E["AbbreviationLbs"] = 'kg';
});

/**
 * Makes default scene settings to be converted
 */
Hooks.on('preCreateScene', (scenedata) => {
    const gridDist = Settings.getSetting("sceneGridDistance");
    const gridUnits = Settings.getSetting("sceneGridUnits");
    if (!Settings.getSetting("sceneConversion")) return
    debug(`New Scene: changing gridUnits to '${gridUnits}' and gridDistance to '${gridDist}'.`);
    scenedata.gridDistance = gridDist;
    scenedata.gridUnits = gridUnits;
})


Hooks.on('renderActorSheet', MetricModule.onRenderActorSheet);

Hooks.on('renderItemSheet', MetricModule.onRenderItemSheet);

Hooks.on('renderJournalSheet', MetricModule.onRenderJurnalSheet);

Hooks.on("renderSidebarTab", MetricModule.onRenderSideBar);

Hooks.on('renderRollTableConfig', MetricModule.onRenderRollTable);

Hooks.on('renderCompendium', MetricModule.onCompendiumRender)
