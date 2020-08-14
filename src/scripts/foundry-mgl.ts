import Utils from "./Utils";
import MetricModule from "./MetricModule";
// @ts-ignore
import { DND5E } from "../../../systems/dnd5e/module/config.js";

const debug = Utils.debug.bind(Utils);

Hooks.on('init', () => {
    debug("Changing labels 'Feet' and 'Miles' to 'Meters' and 'Kilometers'.")
    DND5E.distanceUnits["m"] = game.i18n.localize("metricsystem.meters");
    DND5E.distanceUnits["km"] = game.i18n.localize("metricsystem.kilometers");
    debug("Changing encumbrance calculation.")
    DND5E.encumbrance["currencyPerWeight"] = 100;
    DND5E.encumbrance["strMultiplier"] = 7.5;

});

Hooks.on('renderActorSheet', MetricModule.onRenderActorSheet);

