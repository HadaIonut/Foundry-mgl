import Utils from "./Utils";
import MetricModule from "./MetricModule";
// @ts-ignore
import { DND5E } from "../../../systems/dnd5e/module/config.js";
import Settings from "./Settings";
import ConversionEngine from "./ConversionEngine";

const debug = Utils.debug.bind(Utils);

Hooks.on('init', () => {
    debug("Changing labels 'Feet' and 'Miles' to 'Meters' and 'Kilometers'.")
    DND5E.distanceUnits["m"] = game.i18n.localize("metricsystem.meters");
    DND5E.distanceUnits["km"] = game.i18n.localize("metricsystem.kilometers");
    debug("Changing encumbrance calculation.")
    DND5E.encumbrance["currencyPerWeight"] = 100;
    DND5E.encumbrance["strMultiplier"] = 7.5;

    Settings.registerSettings();
});

Hooks.on('ready', () => {
    debug("Changing label 'lbs.' to 'kg'.");
    // @ts-ignore
    game.i18n.translations.DND5E["AbbreviationLbs"] = 'kg';
});

Hooks.on('preCreateScene', (scenedata) => {
    if (!Settings.getSetting("sceneConversion")) return
    debug("New Scene: changing gridUnits to 'm' and gridDistance to '1.5'.");
    scenedata.gridDistance = Settings.getSetting("sceneGridDistance");
    scenedata.gridUnits = Settings.getSetting("sceneGridUnits");
})


Hooks.on('renderActorSheet', MetricModule.onRenderActorSheet);

Hooks.on('renderItemSheet', MetricModule.onRenderItemSheet);

