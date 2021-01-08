import Settings from "../Settings";
import {numberSelector, numberToWords} from "./WordsToNumbers";

const imperialToMetricMap: { [key: string]: string } = {
    "inch": "centimeters",
    "ft.": "m.",
    "ft": "m",
    "feet": "meters",
    "Feet": "Meters",
    "foot": "meter",
    "mile": "kilometres",
    "miles": "kilometres",
    "yards": "meters",
    "lb": "kg",
    "lb.": "kg.",
    "lbs.": "kg.",
    "pounds": "kilograms",
    "pound": "kilogram"
};

const typesOfUnitsMap: { [key: string]: string } = {
    "ft.": "feet",
    "ft": "feet",
    "feet": "feet",
    "Feet": "feet",
    "foot": "feet",
    "mile": "mile",
    "Mile": "mile",
    "Miles": "mile",
    "miles": "mile",
    "lb": "pound",
    "pound": "pound",
    "lb.": "pound",
    "lbs.": "pound",
    "pounds": "pound"
};


const roundUp = (nr: number): number => Math.round((nr + Number.EPSILON) * 100) / 100;

const cleanCommas = (text: string): string => text?.replace(",", "");

const convertStringToNumber = (toConvert: string) => {
    const numberToReturn = Number(cleanCommas(toConvert));
    return isNaN(numberToReturn) ? -1 : numberToReturn;
}

const convertUsingMultiplier = (toBeConverted: string | number, multiplier: number): number => {
    if (!toBeConverted) return;
    const toConvert = typeof toBeConverted === 'number' ? toBeConverted : convertStringToNumber(toBeConverted);

    return roundUp(toConvert * multiplier);
}

const isMetric = (checkString: string): boolean => !!imperialToMetricMap[checkString];

const convertWeightFromPoundsToKilograms = (weightString: string | number): number => convertUsingMultiplier(weightString, Settings.getMultiplier('pound'));

const convertDistanceFromInchToCentimeters = (distance: string | number): number => convertUsingMultiplier(distance, Settings.getMultiplier('inch'));

const convertDistanceFromFeetToMeters = (distance: string | number): number => convertUsingMultiplier(distance, Settings.getMultiplier('feet'));

const convertDistanceFromMilesToKilometers = (distance: string | number): number => convertUsingMultiplier(distance, Settings.getMultiplier('mile'));

const convertUnitStringToStandard = (unit: string): string => typesOfUnitsMap[unit];

const convertStringFromImperialToMetric = (imperialString: string): string => imperialToMetricMap[imperialString] || imperialString;

const convertDistanceFromImperialToMetric = (distance: string | number, unit: string): string | number => {
    const convertedToStandard = convertUnitStringToStandard(unit);
    switch (convertedToStandard) {
        case "feet":
            return convertDistanceFromFeetToMeters(distance);
        case "mile":
            return convertDistanceFromMilesToKilometers(distance);
        case 'inch':
            return convertDistanceFromInchToCentimeters(distance);
        default:
            return distance;
    }
}

const convertValueToMetric = (value: string | number, unit: string): string | number => {
    const convertedToStandard = convertUnitStringToStandard(unit);
    switch (convertedToStandard) {
        case 'pound':
            return convertWeightFromPoundsToKilograms(value);
        default:
            return convertDistanceFromImperialToMetric(value, unit);
    }
}

const imperialReplacer = (toReplace: string, replaceRegex: RegExp): string =>
    toReplace.replace(replaceRegex, (element: string, value: string, unit: string): string => {
        const replacedValue = convertDistanceFromImperialToMetric(value, unit);
        const replacedUnit = convertStringFromImperialToMetric(unit);
        if (replacedUnit === unit) return element;
        return replacedValue + ' ' + replacedUnit;
    })

const convertText = (text: string): string => {
    return text.replace(/(\b[^\d\W]+\b )?(\b[^\d\W]+\b)([ -])(feet|foot)/g, (_0, wordNumber1, wordNumber2, separator, unit) => {
        const capitalized = wordNumber1 !== wordNumber1?.toLowerCase();
        const selectedNumber = numberSelector(wordNumber1 ? wordNumber1?.toLowerCase().replace(' ', '') : '', wordNumber2?.toLowerCase());
        if (selectedNumber.number) {
            const convertedValue = convertValueToMetric(selectedNumber.number, unit);
            const returnText = selectedNumber.text + numberToWords(Math.ceil(Number(convertedValue))) + separator + convertStringFromImperialToMetric(unit);
            return capitalized ? returnText.charAt(0).toUpperCase() + returnText.slice(1) : returnText;
        }
        return selectedNumber.text + separator + unit;
    }).replace(/([0-9]+) (to|and) ([0-9]+) (feet|inch|foot|ft\.)/g, (_0, number1, separatorWord, number2, units) => {
        return convertValueToMetric(number1, units) + ` ${separatorWord} ` + convertValueToMetric(number2, units) + ` ${convertStringFromImperialToMetric(units)}`;
    }).replace(/([0-9]{1,3}(,[0-9]{3})+)([ -])(feet|foot|pounds)/g, (_0, number: string, _1, separator, label: string) => {
        return convertValueToMetric(number, label) + separator + convertStringFromImperialToMetric(label);
    }).replace(/([0-9]+)\/([0-9]+) (feet|inch|foot|ft\.)/g, (_0, firstNumber: string, secondNumber: string, label: string) => {
        return convertValueToMetric(firstNumber, label) + '/' + convertValueToMetric(secondNumber, label) + ' ' + convertStringFromImperialToMetric(label);
    }).replace(/([0-9]+)(\W|&nbsp;| cubic |-){1,2}(feet|inch|foot|ft\.|pounds|lbs\.|pound|lbs|lb|ft)/g, (_0, number: string, separator: string, label: string) => {
        return convertValueToMetric(number, label) + separator + convertStringFromImperialToMetric(label);
    }).replace(/(several \w+ )(feet|yards)/g, (_0, several, unit) => {
        return several + convertStringFromImperialToMetric(unit);
    })
}

const movementConverter = (speed: any): any => {
    if (!isMetric(speed.units)) return speed;

    const units = speed.units;
    Object.keys(speed).forEach((key) => {
        if (key === 'units' || key === 'hover') return;

        speed[key] = convertValueToMetric(speed[key], units) || 0;
    })
    speed.units = convertStringFromImperialToMetric(speed.units);

    return speed;
}

const convertDistance = (distance: any, onlyUnit?: boolean): any => {
    if (!distance) return distance;
    if (onlyUnit) distance.units = convertStringFromImperialToMetric(distance.units);
    else {
        distance.value = convertValueToMetric(distance.value, distance.units);
        distance.long = convertValueToMetric(distance.long, distance.units);
        distance.units = convertStringFromImperialToMetric(distance.units);
    }
    return distance;
}

const speedConverter = (speed: any): any => {
    speed.value = convertText(speed.value || '');
    speed.special = convertText(speed.special || '');
    return speed;
}

const detailsConverter = (details) => {
    details.biography.value = convertText(details.biography.value);
    if (details.appearance) details.appearance = convertText(details.appearance);
    if (details.bond) details.bond = convertText(details.bond);
    if (details.flaw) details.flaw = convertText(details.flaw);
    if (details.ideal) details.ideal = convertText(details.ideal);
    if (details.trait) details.trait = convertText(details.trait);
    return details;
}

const actorDataConverter = (data: any): any => {
    if (data.attributes.movement) data.attributes.movement = movementConverter(data.attributes.movement);
    if (data.attributes.speed) data.attributes.speed = speedConverter(data.attributes.speed);
    data.traits.senses = imperialReplacer(data.traits.senses || '', /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)
    data.details = detailsConverter(data.details);

    return data;
}

const actorTokenConverter = (token: any) => {
    token.brightLight = convertValueToMetric(token.brightLight, 'feet');
    token.brightSight = convertValueToMetric(token.brightSight, 'feet');
    token.dimLight = convertValueToMetric(token.dimLight, 'feet');
    token.dimSight = convertValueToMetric(token.dimSight, 'feet');
    return token;
}

const labelConverter = (label: string): string => {
    return label.replace(/(([0-9]+) \/ )?([0-9]+) ([\w]+)/, (_0, _1, optionalValue, mainValue, unit) => {
        if (optionalValue)
            return convertValueToMetric(optionalValue, unit) + '/' + convertValueToMetric(mainValue, unit) + ' ' + convertStringFromImperialToMetric(unit);
        return convertValueToMetric(mainValue, unit) + ' ' + convertStringFromImperialToMetric(unit);
    })
}

const findMetrifiedItemId = async (source: string, itemId: string, target: string, cache) => {
    const compendiumSource = game.packs.get(source);
    const compendiumTarget = game.packs.get(target);
    if (compendiumSource && compendiumTarget) {
        await cache(compendiumSource, source);
        await cache(compendiumTarget, target);
        const entry = compendiumSource.index.find(e => e._id === itemId || e.name === itemId);
        if (!entry) return itemId;
        const newEntity = compendiumTarget.index.find(e => e.name === entry.name);

        itemId = newEntity._id;
    }

    return itemId
}

const relinkText = async (text: string, cache?): Promise<string> => {
    const matched = [...text.matchAll(/@Compendium\[([A-Za-z0-9\-]+)\.([A-Za-z0-9\-]+)\.(\w+)\]/g)];
    for (const match of matched) {
        const source = `${match[1]}.${match[2]}`;
        const target = `world.${match[2]}-metrified`;
        if (source.includes('metrified') || !game.packs.get(target)) continue;
        const newId = await findMetrifiedItemId(source, match[3], target, cache);
        if (newId !== match[3])
            text = text.replace(`${source}.${match[3]}`, `${target}.${newId}`);
    }
    return text;
}

export {
    convertValueToMetric,
    convertStringFromImperialToMetric,
    isMetric,
    imperialReplacer,
    convertText,
    actorDataConverter,
    actorTokenConverter,
    convertDistance,
    labelConverter,
    relinkText
}