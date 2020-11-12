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
                case 'rolltable':
                    Dnd5eConverter.rollTableConverter(actor).then(()=>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'compendium':
                    Dnd5eConverter.compendiumConverter(actor).then(()=>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
            }

        });

        element.after(button);
    }

    public onRenderActorSheet(obj, html) {
        let element = html.find(".window-header .window-title")
        MetricModule.addButton(element, obj.object, "actor");

    }

    public onRenderItemSheet(obj, html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.object, "item");
    }

    public onRenderJurnalSheet(obj, html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.object, "sheet");
    }

    public onRenderSideBar(app, html) {
        let button;
        switch (app?.options?.id) {
            case "scenes":
                button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the scenes</button>");
                button.on('click', ()=> Dnd5eConverter.allScenesUpdater());
                html.find(".directory-footer").append(button);
                break;
            case "compendium":
                button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the compendiums</button>");
                button.on('click', ()=> Dnd5eConverter.batchCompendiumConverter());
                html.find(".directory-footer").append(button);
                break;
            case "actors":
                button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the actors</button>");
                button.on('click', ()=> Dnd5eConverter.batchActorConverter());
                html.find(".directory-footer").append(button);
                break;
            case "items":
                button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the items</button>");
                button.on('click', ()=> Dnd5eConverter.batchItemsConverter(app.entities));
                html.find(".directory-footer").append(button);
                break;
            case "tables":
                button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the rollable tables</button>");
                button.on('click', ()=> Dnd5eConverter.batchRolltablesConverter());
                html.find(".directory-footer").append(button);
                break;
            case "journal":
                button = $("<button class='import-markdown'><i class='fas fa-exchange-alt'></i>Metrify all the journal entries</button>");
                button.on('click', ()=> Dnd5eConverter.batchJournalsConverter());
                html.find(".directory-footer").append(button);
                break;
        }
    }

    public onRenderRollTable(obj,html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.object, 'rolltable')
    }

    public onCompendiumRender (obj,html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.collection, 'compendium');
    }

}

export default MetricModule.getInstance();