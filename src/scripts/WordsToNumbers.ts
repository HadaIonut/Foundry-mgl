const digits = {
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9
}

const tens = {
    'ten': 10,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90
}

const irregulars = {
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
}

const bigTens = {
    'hundred': 100,
    'thousand': 1000,
}

const compositions = () => {
    const composites = {};
    for (const ten in tens) for (const digit in digits) composites[`${ten} ${digit}`] = tens[ten] + digits[digit];
    for (const bigTen in bigTens) for (const digit in digits) composites[`${digit} ${bigTen}`] = digits[digit] * bigTens[bigTen];
    return composites;
}

const allTheNumbers = {};

const numbersMerger = () => {
    Object.assign(allTheNumbers, digits, tens, irregulars, bigTens);
    Object.assign(allTheNumbers, compositions());
}

const isKeyWord = (word: string):boolean => {
    if (word === 'several') return true;
    return false;
}

/**
 * So this function does something, that is for sure
 * But it's been 40 minutes since i worked on it and i have no idea what exactly it does
 *
 * @param word1
 * @param word2
 */
const numberSelecter = (word1: string, word2: string): number | string => {
    numbersMerger();
    let text = '';
    if (isKeyWord(word1)) return `${word1} ${word2}`;
    if (allTheNumbers[word1]) {
        text += `${word1} `;
        word1 = '';
    } else word1 += ' ';
    if (allTheNumbers[word2]) {
        text += word2;
        word2 = ''
    }
    for (const numbers in allTheNumbers) if (text === numbers) return word1 + word2 + allTheNumbers[numbers];
    return `${word1} ${word2}`;
}

export {numberSelecter};