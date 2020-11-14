import {
    convertStringFromImperialToMetric,
    convertValueToMetric,
    imperialReplacer,
    isMetric
} from "./ConversionEngineNew";
import {numberSelector, numberToWords} from "./WordsToNumbers";

const labelConverter = (label: string): string => {
    return label.replace(/(([0-9]+) \/ )?([0-9]+) ([\w]+)/, (_0, _1, optionalValue, mainValue, unit) => {
        if (optionalValue)
            return convertValueToMetric(optionalValue, unit) + '/' + convertValueToMetric(mainValue, unit) + ' ' + convertStringFromImperialToMetric(unit);
        return convertValueToMetric(mainValue, unit) + ' ' + convertStringFromImperialToMetric(unit);
    })
}

const convertDistance = (distance: any): any => {
    if (!distance) return distance;
    distance.value = convertValueToMetric(distance.value, distance.units);
    distance.long = convertValueToMetric(distance.long, distance.units);
    distance.units = convertStringFromImperialToMetric(distance.units);

    return distance;
}

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
    }).replace(/([0-9]+)([\W\D\S]|&nbsp;| cubic |-){1,2}(feet|inch|foot|ft\.|pounds|lbs\.|pound|lbs|lb)/g, (_0, number: string, separator: string, label: string) => {
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

        speed[key] = convertValueToMetric(speed[key], units);
    })
    speed.units = convertStringFromImperialToMetric(speed.units);

    return speed;
}

const speedConverter = (speed: any): any => {
    speed.value = this._convertText(speed.value || '');
    speed.special = this._convertText(speed.special || '');
    return speed;
}

const actorDataConverter = (data: any): any => {
    data.attributes.movement = this._movementConverter(data.attributes.movement);
    if (data.attributes.speed)
        data.attributes.speed = this._speedConverter(data.attributes.speed);
    data.traits.senses = imperialReplacer(data.traits.senses || '', /(?<value>[0-9]+ ?)(?<unit>[\w]+)/g)

    return data;
}