import {loading} from "../Utils/Utils.js";
import {createErrorMessage} from "../Utils/ErrorHandler.js";
import {convertText, convertValueToMetric} from "../Utils/ConversionEngineNew.js";
import {convertInconsistentText, convertTrait, speedConverter} from "./Pf2eConverter.js";
import {journalUpdater} from "../Dnd5e/Compendium5eConverter.js";

const itemConverter = (item) => {
    if (item.data.area) item.data.area.value = String(convertValueToMetric(item.data.area.value, 'ft'));
    if (item.data.areasize) item.data.areasize.value = convertText(item.data.areasize.value);
    item.data.description.value = convertText(item.data.description.value);
    if (item.data.range) item.data.range.value = convertInconsistentText(item.data.range.value);
    if (item.data.traits.value) item.data.traits.value = item.data.traits.value.map((trait) => convertTrait(trait));

    return item;
}

const itemsConverter = (items) => {
    for (let i = 0; i < items.length; i++) {
        items[i] = itemConverter(items[i]);
    }
    return items;
}

const actorConverter = (actor) => {
    actor.data.traits.senses.value = convertText(actor?.data?.traits?.senses?.value);
    actor.data.attributes.speed = speedConverter(actor?.data?.attributes?.speed);

    itemsConverter(actor.items);
}

const classConverter = (entity) => {
    Object.keys(entity.data.items).forEach((key) => {
        const item = entity.data.items[key];
        const packLabel = game.packs.get(item.pack)?.metadata?.label;
        if (!packLabel) return;
        const metrifiedLabel = `${packLabel} Metrified`;
        entity.data.items[key].pack = `world.${metrifiedLabel.slugify({strict: true})}`;
    })
    entity.data.description.value = convertText(entity.data.description.value);
}

const typeMap = {
    'NPCPF2e': actorConverter,
    'FeatPF2e': itemConverter,
    'ActionPF2e': itemConverter,
    'AncestryPF2e': itemConverter,
    'BackgroundPF2e': itemConverter,
    'EffectPF2e': itemConverter,
    'ClassPF2e': classConverter,
    'ConditionPF2e': itemConverter,
    'EquipmentPF2e': itemConverter,
    'WeaponPF2e': itemConverter,
    'ArmorPF2e': itemConverter,
    'ConsumablePF2e': itemConverter,
    'KitPF2e': itemConverter,
    'TreasurePF2e': itemConverter,
    'ContainerPF2e': itemConverter,
    'SpellPF2e': itemConverter,
    'JournalEntry': journalUpdater
}

const typeSelector = (entity, type) => typeMap[type](entity) || entity;

const convertCompendium = async (compendium) => {
    try {
        const pack = game.packs.get(compendium.collection || compendium);
        await pack.getIndex();
        const newPack = await pack.duplicateCompendium({
            label: `${pack.metadata.label} Metrified`
        })
        await newPack.getIndex();

        const loadingBar = loading(`Converting compendium ${pack.metadata.label}`)(0)(pack.index.size - 1);
        for (const index of newPack.index) {
            try {
                const entity = await newPack.getDocument(index._id);
                let entityClone = JSON.parse(JSON.stringify(entity.data));

                entityClone = typeSelector(entityClone, entity.constructor.name);

                await entity.update(entityClone);

                loadingBar();
            } catch (e) {
                createErrorMessage(e, 'compendiumUpdater', compendium);
            }
        }
    } catch (e) {
        createErrorMessage(e, 'compendiumUpdater', compendium);
    }
}

export {convertCompendium}