class MetricModule {
    private static _instance: MetricModule;

    private constructor() {
    }

    public static getInstance(): MetricModule {
        if (!MetricModule._instance) MetricModule._instance = new MetricModule();
        return MetricModule._instance;
    }

    static addButton(element, actor) {
        // Can't find it?
        if (element.length != 1) {
            return;
        }
        let button = $(`<a class="popout" style><i class="fas fa-ruler"></i>${game.i18n.localize("Metrificator")}</a>`);
        button.on('click', (event) => this._updateItem(actor));
        element.after(button);
    }

    public onRenderActorSheet(obj, html) {
        let element = html.find(".window-header .window-title")
        //console.log(obj.object.data._id)
        MetricModule.addButton(element, obj);

    }

    private static async _updateItem(actor: any) {
        const act = actor.object.data
        const item = act.items.find(i => i.name === "Greatsword");
        if (!item) return;
        const update = {_id: item._id, name: "Magic Sword +1"};
        const updated = await actor.object.updateEmbeddedEntity("OwnedItem", update); // Updates one EmbeddedEntity
    }
}

export default MetricModule.getInstance();