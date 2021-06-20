import {convertStringFromImperialToMetric, convertText, convertValueToMetric} from "../Utils/ConversionEngineNew.js";
import {copyObject} from "../Utils/Utils.js";

const convertTrait = (trait) => trait.replace(/reach-([0-9]+)/, (_0, value) => `Reach ${convertValueToMetric(value, 'ft')} m`);

const convertInconsistentText = (speed) => speed.replace(/([0-9]+)(\W|&nbsp;| cubic |-)?(feet|inch|foot|ft\.|pounds|lbs\.|pound|lbs|lb|ft)?/, (_0, number, separator, label) => {
    return `${convertValueToMetric(number, label ? label : 'ft')}${separator || ''}${label ? convertStringFromImperialToMetric(label): ''}`
})

const speedConverter = (speedObject) => {
    speedObject.value = convertInconsistentText(speedObject.value);
    speedObject.otherSpeeds.map((otherSpeed) => {
        otherSpeed.value = convertInconsistentText(otherSpeed.value);
    })
    return speedObject;
}

const updateItems = async (items) => {
    for (const item of items) await updateItem(item);
}

const updateItem = async (item) => {
    const itemCopy = copyObject(item.data);

    if (itemCopy.data.area) itemCopy.data.area.value = convertValueToMetric(itemCopy.data.area.value, 'ft');
    if (itemCopy.data.areasize) itemCopy.data.areasize.value = convertText(itemCopy.data.areasize.value);
    itemCopy.data.description.value = convertText(itemCopy.data.description.value);
    if (itemCopy.data.range) itemCopy.data.range.value = convertInconsistentText(itemCopy.data.range.value);
    if (itemCopy.data.traits.value) itemCopy.data.traits.value = itemCopy.data.traits.value.map((trait) => convertTrait(trait));

    await item.update(itemCopy);
}

const updateActor = async (actor) => {
    const actorCopy = copyObject(actor.data);
    if (actor.getFlag("Foundry-MGL", "converted")) return;

    actorCopy.data.traits.senses.value = convertText(actorCopy?.data?.traits?.senses?.value);
    actorCopy.data.attributes.speed = speedConverter(actorCopy?.data?.attributes?.speed);

    await actor.setFlag("Foundry-MGL", "converted", true);
    await actor.update(actorCopy);
    await updateItems(actor.data.items);
}

export {updateActor, updateItem}
