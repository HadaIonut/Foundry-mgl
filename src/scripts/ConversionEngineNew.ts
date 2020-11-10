import Settings from "./Settings";

const distanceToMetricMap: { [key: string]: string } = {
    "inch": "centimeters",
    "ft.": "m.",
    "ft": "m",
    "feet": "meters",
    "Feet": "Meters",
    "foot": "meter",
    "mile": "kilometres",
    "miles": "kilometres",
    "yards": "meters"
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

const weightToKilogramsMap: { [key: string]: string } = {
    "lb": "kg",
    "lb.": "kg.",
    "lbs.": "kg.",
    "pounds": "kilograms",
    "pound": "kilogram"
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

const isMetric = (checkString: string): boolean => !!distanceToMetricMap[checkString];

const convertWeightFromPoundsToKilograms = (weightString: string | number): number => convertUsingMultiplier(weightString, Settings.getMultiplier('pound'));

const convertDistanceFromInchToCentimeters = (distance: string | number): number => convertUsingMultiplier(distance, Settings.getMultiplier('inch'));

const convertDistanceFromFeetToMeters = (distance: string | number): number => convertUsingMultiplier(distance, Settings.getMultiplier('feet'));

const convertDistanceFromMilesToKilometers = (distance: string | number): number => convertUsingMultiplier(distance, Settings.getMultiplier('mile'));

const convertUnitStringToStandard = (unit: string): string => typesOfUnitsMap[unit];

const convertWeightStringToKilograms = (lbString: string): string => weightToKilogramsMap[lbString] || 'lb.';

const convertDistanceStringToMetric = (ftString: string): string => distanceToMetricMap[ftString] || ftString;

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
        const replacedUnit = convertDistanceStringToMetric(unit);
        if (replacedUnit === unit) return element;
        return replacedValue + ' ' + replacedUnit;
    })

