const AUDIO_REQUIRED_PROPERTIES = ["abridged", "accessMode", "accessModeSufficient", "accessibilityFeature", 
        "accessibilityHazard", "accessibilitySummary", "author", "dateModified", "datePublished", "id", 
        "inLanguage", "name", "readBy", "readingProgression", "resources", "url"];

const AUDIOBOOKS_PROFILE = "https://www.w3.org/TR/audiobooks/";        

import { isValidDuration, isAudioFormat, isValidLanguageTag, isValidDate, isImageFormat, getDurationInSeconds } from './utils.js';
import { globalDataCheck } from './globalDataCheck.js';
let errors = [];

function dataValidation(processed) {

    let processed_ = processed;
    errors = [];    

    // use lowercase everywhere
    if (processed_.hasOwnProperty('links')) {
        processed_.links = lowerCaseRel(processed_.links);
    }
    if (processed_.hasOwnProperty('readingOrder')) {
        processed_.readingOrder = lowerCaseRel(processed_.readingOrder);        
    }
    if (processed_.hasOwnProperty('resources')) {
        processed_.resources = lowerCaseRel(processed_.resources);
    }


    if (processed_.profile == AUDIOBOOKS_PROFILE) {
        try {
            let {data: processed__, errors: errors_} = audiobooksDataValidation(processed_);
            processed_ = processed__;
            errors = errors.concat(errors_);
        }
        catch(err) {
            errors.push({severity: "fatal", msg: `${err}`});
        }
    } 

    if (!processed_.hasOwnProperty('type') || processed_.type.length == 0 ) {
        errors.push({severity: "validation", msg: "No type"});
        processed_.type = ['CreativeWork'];
    }

    if (processed_.hasOwnProperty('accessModeSufficient')) {
        let value = processed_.accessModeSufficient;
        if (value instanceof Array) {
            processed_.accessModeSufficient = value.filter(v => {
                if (v.hasOwnProperty('type') && v.type === 'ItemList') {
                    return true;
                }
                else {
                    errors.push({severity: 'validation', msg: `accessModeSufficient requires an array of ItemList objects`});
                    return false;
                }
            });
        }
        else {
            errors.push({severity: 'validation', msg: `Array expected for accessModeSufficient`});
            delete processed_.accessModeSufficient;
        }
    }

    if (!processed_.hasOwnProperty('id') || processed_.id == '') {
        errors.push({severity: "validation", msg: "ID not set"});
    }

    if (processed_.hasOwnProperty('duration') && !isValidDuration(processed_.duration)) {
        errors.push({severity: "validation", msg: 'Invalid value for property "duration"'});
        delete processed_.duration;
    }

    if (processed_.hasOwnProperty('dateModified') && !isValidDate(processed_.dateModified)) {
        errors.push({severity: "validation", msg: 'Invalid value for property "dateModified"'});
        delete processed_.dateModified;
    }

    if (processed_.hasOwnProperty('datePublished') && !isValidDate(processed_.datePublished)) {
        errors.push({severity: "validation", msg: 'Invalid value for property "datePublished"'});
        delete processed_.datePublished;
    }

    if (processed_.hasOwnProperty('inLanguage')) {
        processed_.inLanguage.filter(lang => !isValidLanguageTag(lang))
            .map(invalidItem => errors.push({severity: "validation", msg: `Invalid language tag *${invalidItem}*`}));
        processed_.inLanguage = processed_.inLanguage.filter(lang => isValidLanguageTag(lang));
    }

    if (processed_.hasOwnProperty('readingProgression')) {
        if (!["ltr", "rtl"].includes(processed_.readingProgression)) {
            errors.push({severity: "validation", msg: `Invalid value for property "readingProgression" *${processed_.readingProgression}*`});
            processed_.readingProgression = "ltr";
        }
    }
    else {
        processed_.readingProgression = 'ltr';
    }

    let urls = [];
    if (processed_.hasOwnProperty("readingOrder")) {
        urls = processed_.readingOrder.map(item => {
            let u = new URL(item.url, processed_.base);
            return `${u.origin}${u.pathname}`; // don't include the fragment
        });
    }

    if (processed_.hasOwnProperty("resources")) {
        urls = urls.concat(processed_.resources.map(item => {
            let u = new URL(item.url, processed_.base);
            return `${u.origin}${u.pathname}`; // don't include the fragment
        }));
    }
    processed_.uniqueResources = Array.from(new Set(urls));

    if (processed_.hasOwnProperty('links')) {
        let keepLinks = processed_.links.filter(item => {
            if (!item.hasOwnProperty('rel') || item.rel.length == 0) {
                errors.push({severity: "validation", msg: `Link missing property "rel" *${item.url}*`});
            }
            let u = new URL(item.url);
            let url = `${u.origin}${u.pathname}`; // don't include the fragment
            if (processed_.uniqueResources.includes(url)) {
                errors.push({severity: "validation", msg: `URL ${item.url} appears in bounds; removed from "links".`})
                return false;
            }
            if (item.hasOwnProperty('rel') && 
                (item.rel.includes('contents') || item.rel.includes('pagelist') || item.rel.includes('cover'))) {
                errors.push({severity: "validation", msg: `Invalid value for property "rel" in "links" (cannot be "cover", "contents", or "pagelist").`});
                return false;
            }
            return true;
        });
        processed_.links = keepLinks;
    }

    let resources = [];
    if (processed_.hasOwnProperty('readingOrder')) {
        resources = processed_.readingOrder;
    }
    if (processed_.hasOwnProperty('resources')) {
        resources = resources.concat(processed_.resources);
    }

    // warn on duplicates in reading order
    if (processed_.hasOwnProperty('readingOrder')) {
        let urls_ = processed_.readingOrder.map(item => {
            let u = new URL(item.url);
            return `${u.origin}${u.pathname}`;
        });
        let uniqueUrls_ = Array.from(new Set(urls_));
        if (urls_.length != uniqueUrls_.length) {
            errors.push({severity: "validation", msg: "Reading order contains duplicate URLs"});
        }
    }

    // remove and warn about duplicates in resources
    if (processed_.hasOwnProperty('resources')) {
        let urls_ = processed_.resources.map(item => {
            let u = new URL(item.url);
            return `${u.origin}${u.pathname}`;
        });
        let uniqueUrls_ = Array.from(new Set(urls_));
        if (urls_.length != uniqueUrls_.length) {
            // remove duplicates
            let j;
            let uniqueResources_ = [];
            for (j=0; j<processed_.resources.length; j++) {
                let url1 = new URL(processed_.resources[j].url);
                let itemExists = uniqueResources_.find(item => {
                    let url2 = new URL(item.url);
                    // compare the URLs without the fragment
                    return `${url1.origin}${url1.pathname}` == `${url2.origin}${url2.pathname}`;
                });
                if (!itemExists) {
                    uniqueResources_.push(processed_.resources[j]);
                }
                else {
                    errors.push({severity: "validation", msg: `Duplicate resource ${processed_.resources[j].url}`});
                }
            }
            processed_.resources = uniqueResources_;
        }
    }
    
    if (resources.filter(item => item.hasOwnProperty("rel") && item.rel.includes("contents")).length > 1) {
        errors.push({severity: "validation", msg: "Multiple resources with rel=contents"});
    }
    if (resources.filter(item => item.hasOwnProperty("rel") && item.rel.includes("pagelist")).length > 1) {
        errors.push({severity: "validation", msg: "Multiple resources with rel=pagelist"});
    }
    if (resources.filter(item => item.hasOwnProperty("rel") && item.rel.includes("cover")).length > 1) {
        errors.push({severity: "validation", msg: "Multiple resources with rel=cover"});
    }
    resources.filter(item => item.hasOwnProperty("rel") && item.rel.includes("cover") 
        && isImageFormat(item.encodingFormat) && !item.hasOwnProperty('name')).map(item => 
        errors.push({severity: "validation", msg: `All image covers must have a "name" property`}));
    
    if (processed_.hasOwnProperty('readingOrder')) {
        processed_.readingOrder = validateDurations(processed_.readingOrder);
    }
    if (processed_.hasOwnProperty('links')) {
        processed_.links = validateDurations(processed_.links);
    }
    if (processed_.hasOwnProperty('resources')) {
        processed_.resources = validateDurations(processed_.resources);
    }
    
    removeEmptyArrays(processed_);

    let {data: globalDataCheckProcessed, errors: globalDataCheckErrors} = globalDataCheck(processed_);
    processed_ = globalDataCheckProcessed;
    errors = errors.concat(globalDataCheckErrors);

    return {"data": processed_, errors};
}

function removeEmptyArrays(value) {
    if (value instanceof Array && value.length == 0) {
        return false;
    }
    if (value instanceof Object) {
        Object.keys(value).map(key => {
            if (!removeEmptyArrays(value[key])) {
                delete value[key];
            }
        });
    }
    return true;
}

function audiobooksDataValidation(processed) {
    let processed_ = processed;
    let errors = [];

    // check reading order
    if (!processed_.hasOwnProperty('readingOrder')) {
        throw 'Missing property "readingOrder"';
    }

    let audioReadingOrderItems = processed_.readingOrder.filter(item => isAudioFormat(item.encodingFormat));
    if (processed_.readingOrder.length > audioReadingOrderItems.length) {
        errors.push({severity: "validation", msg: 'Non-audio reading order items encountered'});
        processed_.readingOrder = audioReadingOrderItems;
    }

    if (processed_.readingOrder.length == 0) {
        throw 'No reading order items available';
    }

    // check type
    if (!processed_.hasOwnProperty('type') || processed_.type.length == 0) {
        errors.push({severity: "validation", msg: 'Missing property "type"'});
        processed_.type = ["Audiobook"];
    }

    // check required properties
    AUDIO_REQUIRED_PROPERTIES.filter(prop => !processed_.hasOwnProperty(prop))
        .map(missingProp => errors.push(
            {severity: "validation", msg: `Missing property "${missingProp}"`}));
    
    let cover = null;
    // check for cover
    if (processed_.hasOwnProperty('resources')) {
        cover = processed_.resources.find(r => r.rel ? r.rel.includes("cover") : false);
    }
    if (!cover) {
        errors.push({severity: 'validation', msg: 'Missing "cover" resource'});
    }

    // check that reading order duration is present
    if (processed_.hasOwnProperty('readingOrder')) {
        processed_.readingOrder.map(item => {
            if (!item.hasOwnProperty('duration')) {
                errors.push({severity: 'validation', 
                    msg: `Reading order item ${item.url} missing property "duration"`});
            }
        });
    }
    if (!processed_.hasOwnProperty('duration')) {
        errors.push({severity: "validation", msg: 'Missing property "duration"'})
    }
    else {
        let totalDuration = processed_.readingOrder.reduce((acc, curr) => {
            if (curr.hasOwnProperty('duration')) {
                acc+= getDurationInSeconds(curr.duration);
            }
            return acc;
        }, 0);

        if (totalDuration != getDurationInSeconds(processed_.duration)) {
            errors.push({severity: "validation", msg: 'Incorrect value for top-level property "duration"'});
        }
    }
    return {"data": processed_, errors};
}

function lowerCaseRel(linkedResources) {
    let output = linkedResources.map(item => 
        item.hasOwnProperty('rel') ? 
            ({...item, rel: item.rel.map(r => r.toLowerCase())}) : item);
    return output;
}

function validateDurations(linkedResourcesArr) {
    let linkedResourcesArr_ = linkedResourcesArr.map(item => {
        if (item.hasOwnProperty('duration')) {
            if (!isValidDuration(item.duration)) {
                errors.push({severity: 'validation', 
                    msg: `Linked resource item ${item.url} has invalid value for property "duration" *${item.duration}*`});
                let item_ = item;
                delete item_.duration;
                return item_;
            }
            else {
                return item;
            }
        }
        else {
            return item;
        }
    });
    return linkedResourcesArr_;
}
export {dataValidation};