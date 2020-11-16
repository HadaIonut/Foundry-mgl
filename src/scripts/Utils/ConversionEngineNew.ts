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
    }).replace(/([0-9]+)([\W\D\S]|&nbsp;| cubic |-){1,2}(feet|inch|foot|ft\.|pounds|lbs\.|pound|lbs|lb|ft)/g, (_0, number: string, separator: string, label: string) => {
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

const convertDistance = (distance: any): any => {
    if (!distance) return distance;
    distance.value = convertValueToMetric(distance.value, distance.units);
    distance.long = convertValueToMetric(distance.long, distance.units);
    distance.units = convertStringFromImperialToMetric(distance.units);

    return distance;
}

const speedConverter = (speed: any): any => {
    speed.value = convertText(speed.value || '');
    speed.special = convertText(speed.special || '');
    return speed;
}

const actorDataConverter = (data: any): any => {
    if (data.attributes.movement) data.attributes.movement = movementConverter(data.attributes.movement);
    if (data.attributes.speed) data.attributes.speed = speedConverter(data.attributes.speed);
    data.traits.senses = imperialReplacer(data.traits.senses || '', /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)

    return data;
}

const labelConverter = (label: string): string => {
    return label.replace(/(([0-9]+) \/ )?([0-9]+) ([\w]+)/, (_0, _1, optionalValue, mainValue, unit) => {
        if (optionalValue)
            return convertValueToMetric(optionalValue, unit) + '/' + convertValueToMetric(mainValue, unit) + ' ' + convertStringFromImperialToMetric(unit);
        return convertValueToMetric(mainValue, unit) + ' ' + convertStringFromImperialToMetric(unit);
    })
}

export {convertValueToMetric, convertStringFromImperialToMetric, isMetric, imperialReplacer, convertText, actorDataConverter, convertDistance, labelConverter}