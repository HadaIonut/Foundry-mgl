import Utils from "./Utils";
import conversionEngine from "./ConversionEngine";

const debug = Utils.debug.bind(Utils);

Hooks.once('init', () => {
    console.log('ceapa');
});

Hooks.once('renderActorSheet', (args) => {
    debug(args);
    args.object.data = conversionEngine.toMetricConverter(args.object.data);
});