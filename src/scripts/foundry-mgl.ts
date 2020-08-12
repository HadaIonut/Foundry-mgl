import Utils from "./Utils";
const debug = Utils.debug.bind(Utils);

Hooks.once('init', () => {
    console.log('ceapa');
});

Hooks.once('renderActorSheet', (args) => {
    debug(args);
    args.object.data.items[20].data.target.value = 30;
});