import Utils from "./Utils";
import Dnd5eConverter from "./Dnd5eConverter";
import MetricModule from "./MetricModule";

const debug = Utils.debug.bind(Utils);

Hooks.once('init', () => {
    console.log('ceapa');
});


Hooks.on('renderActorSheet', MetricModule.onRenderActorSheet);

/*
Hooks.on('renderActorSheet', (args) => {
    debug(args);
    args.object.data = Dnd5eConverter.toMetricConverter5e(args.object.data);
    debug(args);
});*/