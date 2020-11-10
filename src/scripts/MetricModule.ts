import Dnd5eConverter from "./Dnd5eConverter";

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
            ui.notifications.warn(`Metrifying the ${type}, hold on tight.`);
            switch (type) {
                case 'actor':
                    Dnd5eConverter.actorUpdater(actor).then(()=>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'item':
                    Dnd5eConverter.itemUpdater(actor).then(()=>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'sheet':
                    Dnd5eConverter.journalUpdater(actor).then(()=>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
            }

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

    public onRenderScenesDirectory(app, html) {
        if (app?.options?.id == "scenes") {
            let button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the scenes</button>");
            button.on('click', ()=> Dnd5eConverter.allScenesUpdater());
            html.find(".directory-footer").append(button);
        }
    }

}

export default MetricModule.getInstance();