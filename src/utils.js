
// most common web audio mimetypes
// https://caniuse.com/#feat=audio
const AUDIOMIMES = 
[
    'audio/wav', 'audio/mpeg',  'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/aacp',
    'audio/flac', 'audio/ogg', 'audio/mp3'
];

// common image file types
// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const IMAGEMIMES = 
[
    'image/apng', 'image/bmp', 'image/gif', 'image/x-icon', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/tiff', 'image/webp'
];

async function fetchFile(file) {
    let data = await fetch(file);
    if (data) {
        let text = await data.text();
        return text;
    }
    else {
        return null;
    }
}

async function fetchContentType(file) {
    let res = null;
    try {
        res = await fetch(file);    
    }
    catch (err) {
        console.log(err);
        return '';
    }
    if (res) {
        let contentType = res.headers.get("Content-Type");
        if (contentType) {
            if (contentType.indexOf(';') != -1) {
                return contentType.split(';')[0];
            }
            else {
                return contentType;
            }
        }
        else {
            return '';
        }
    }
    return '';
}

// from https://github.com/SafetyCulture/bcp47/blob/develop/src/index.js
function isValidLanguageTag(locale) {
    const pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len

    /**
     * Validate a locale string to test if it is bcp47 compliant
     * @param {String} locale The tag locale to parse
     * @return {Boolean} True if tag is bcp47 compliant false otherwise
     */
    if (typeof locale !== 'string') return false;
    return pattern.test(locale);
}

function isAudioFormat(encodingFormat) {
    return AUDIOMIMES.includes(encodingFormat);
}

function isImageFormat(encodingFormat) {
    return IMAGEMIMES.includes(encodingFormat);
}

// looking for "PT4S" or "PT1234566S"
function isValidDuration(val) {
    if (typeof val != "string") {
        return false;
    }
    // if (val.length < 4) {
    //     return false;
    // }
    // if (val.substr(0, 2) != 'PT') {
    //     return false;
    // }
    // if (val[val.length - 1] != 'S' && val[val.length - 1] != 'M') {
    //     return false;
    // }
    // let res = parseInt(val.substr(2, val.length-3));
    // return !isNaN(res);

    // just check that it is nonzero
    return moment.duration(val).asMilliseconds() != 0;
}
function getDurationInSeconds(val) {
    return moment.duration(val).asSeconds();
}
function isValidDate(val) {
    let re = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    let res =  re.test(val);
    return res;
}
export { fetchFile, fetchContentType, isValidLanguageTag, isAudioFormat, isImageFormat, isValidDuration, isValidDate, getDurationInSeconds };