import {
    actorUpdater,
    itemUpdater,
    journalUpdater,
    rollTableUpdater,
    compendiumUpdater,
    batchCompendiumUpdater
} from "./Dnd5e/Dnd5eConverterNew";
import {initBatchConversion} from "./Dnd5e/BatchConversion";
import {relinkCompendiums, relinkCompendium} from "./Dnd5e/Compendium5eConverter";

class MetricModule {
    private static _instance: MetricModule;

    private constructor() {
    }

    public static getInstance(): MetricModule {
        if (!MetricModule._instance) MetricModule._instance = new MetricModule();
        return MetricModule._instance;
    }

    static addButton(element, actor, type) {
        if(!game.user.hasRole(4)) return;
        if (element.length != 1) return;

        let button = $(`<a class="popout" style><i class="fas fa-ruler"></i>Metrificator</a>`);
        button.on('click', () => {
            ui.notifications.warn(`Metrifying the ${type}, hold on tight.`);
            switch (type) {
                case 'actor':
                    actorUpdater(actor).then(() =>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'item':
                    itemUpdater(actor).then(() =>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'sheet':
                    journalUpdater(actor).then(() =>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'rolltable':
                    rollTableUpdater(actor).then(() =>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`));
                    break;
                case 'compendium':
                    compendiumUpdater(actor).then(() =>
                        ui.notifications.info(`Metrification complete, enjoy a better ${type}`))
                    break;
            }
        });
        //for only converting the labels
        // let labelButton = $(`<a class="popout" style><i class="fas fa-ruler"></i>Label Converter</a>`);
        // labelButton.on('click', ()=> {
        //     switch (type) {
        //         case 'actor':
        //             actorUpdater(actor, true);
        //             break;
        //         case 'item':
        //             itemUpdater(actor, true);
        //             break;
        //         case 'compendium':
        //             compendiumUpdater(actor, true);
        //             break;
        //     }
        // })
        // let unitFix = $(`<a class="popout" style><i class="fas fa-ruler"></i>Unit fix</a>`);
        // unitFix.on('click', ()=> {
        //     switch (type) {
        //         case 'actor':
        //             actorUpdater(actor, true, true);
        //             break;
        //         case 'item':
        //             itemUpdater(actor, true, true);
        //             break;
        //         case 'compendium':
        //             compendiumUpdater(actor, true, true);
        //             break;
        //     }
        // })
        element.after(button);
        //element.after(unitFix);
        //element.after(labelButton);
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
        if(!game.user.hasRole(4)) return;
        const mm = this;
        let button = $(`<button><i class='fas fa-exchange-alt'></i>Metrify all the ${app?.options?.id}</button>`);
        let batchConvert
        switch (app?.options?.id) {
            case "scenes":
                // @ts-ignore
                batchConvert = initBatchConversion(game.scenes.entries, app?.options?.id);
                button.on('click', () => mm._createWarningDialog(batchConvert));
                break;
            case "compendium":
                // @ts-ignore
                batchConvert = batchCompendiumUpdater(game.packs.keys());
                button.on('click', () => mm._createWarningDialog(batchConvert));
                break;
            case "actors":
                // @ts-ignore
                batchConvert = initBatchConversion(game.actors.entries, app?.options?.id);
                button.on('click', () => mm._createWarningDialog(batchConvert));
                break;
            case "items":
                // @ts-ignore
                batchConvert = initBatchConversion(game.items.entries, app?.options?.id);
                button.on('click', () => mm._createWarningDialog(batchConvert));
                break;
            case "tables":
                // @ts-ignore
                batchConvert = initBatchConversion(game.tables.entries, app?.options?.id);
                button.on('click', () => mm._createWarningDialog(batchConvert));
                break;
            case "journal":
                // @ts-ignore
                batchConvert = initBatchConversion(game.journal.entries, app?.options?.id);
                button.on('click', () => mm._createWarningDialog(batchConvert));
                break;
        }
        if (app?.options?.id !== 'combat' && app?.options?.id !== 'playlists' && !app?.options?.id.includes('popout'))
            html.find(".directory-footer").append(button);
    }

    private _createWarningDialog(callFunction: any) {
        new Dialog({
            title: 'Warning!',
            content: 'You are about to process a lot of data. Are you sure you wana do that? It will take a bit...',
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'yes',
                    callback: () => callFunction(),
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'no',
                }
            },
            default: 'ok',
        }).render(true);
    }

    public onRenderRollTable(obj, html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.object, 'rolltable')
    }

    public onCompendiumRender(obj, html) {
        let element = html.find(".window-header .window-title");
        MetricModule.addButton(element, obj.collection, 'compendium');
        /*
        Intended for debugging the relinking function
        let button = $(`<a class="popout" style><i class="fas fa-ruler"></i>Relink</a>`);
        button.on('click', () => relinkCompendium(obj.collection))
        element.after(button)
        */
    }

}

export default MetricModule.getInstance();