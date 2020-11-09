import Dnd5eConverter from "./Dnd5eConverter";
import ConversionEngine from "./ConversionEngine";

class MetricModule {
    private static _instance: MetricModule;

    private constructor() {
    }

    public static getInstance(): MetricModule {
        if (!MetricModule._instance) MetricModule._instance = new MetricModule();
        return MetricModule._instance;
    }

    static addButton(element, actor, type) {
        if (element.length != 1) return;

        let button = $(`<a class="popout" style><i class="fas fa-ruler"></i>Metrificator</a>`);
        button.on('click', () => {
            type === 'actor' ? Dnd5eConverter.actorUpdater(actor) : type === 'item' ? Dnd5eConverter.itemUpdater(actor) : Dnd5eConverter.journalUpdater(actor);
        });

        element.after(button);
    }

    public onRenderActorSheet(obj, html) {
        let element = html.find(".window-header .window-title")
        MetricModule.addButton(element, obj, "actor");

    }

    public onRenderItemSheet(obj, html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.object, "item");
    }

    public onRenderJurnalSheet(obj, html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.object, "sheet");
    }


}

export default MetricModule.getInstance();