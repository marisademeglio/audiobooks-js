const AUDIO_REQUIRED_PROPERTIES = ["abridged", "accessMode", "accessModeSufficient", "accessibilityFeature", 
        "accessibilityHazard", "accessibilitySummary", "author", "dateModified", "datePublished", "id", 
        "inLanguage", "name", "readBy", "readingProgression", "resources", "url"];

const AUDIOBOOKS_PROFILE = "https://www.w3.org/TR/audiobooks/";        

import { isValidDuration, isAudioFormat, getDuration, isValidLanguageTag, isValidDate, isImageFormat } from './utils.js';

function dataValidation(processed) {

    let processed_ = processed;
    let errors = [];

    Object.keys(processed_).map(key => {
        let retval = globalDataCheck(key, processed_[key]);
        if (retval.success) {
            processed_[key] = retval.value;
        }
    });

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
        processed_.type = ['CreativeWork'];
    }

    if (processed_.hasOwnProperty('accessModeSufficient')) {
        processed_.accessModeSufficient = processed_.accessModeSufficient.filter(item =>
            item.hasOwnProperty('type') 
            && item.type != 'ItemList'
        );
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
            .map(invalidItem => errors.push({severity: "validation", msg: `Invalid languge tag *${invalidItem}*`}));
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
            let u = new URL(item.url);
            return `${u.origin}${u.pathname}`; // don't include the fragment
        });
    }

    if (processed_.hasOwnProperty("resources")) {
        urls = urls.concat(processed_.resources.map(item => {
            let u = new URL(item.url);
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
                return false;
            }
            if (item.hasOwnProperty('rel') && 
                (item.rel.includes('contents') || item.rel.includes('pagelist') || item.rel.includes('cover'))) {
                errors.push({severity: "validation", msg: `Invalid value for property \"rel\" *cover*`});
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
    
    removeEmptyArrays(processed_);

    return {"data": processed_, errors};
}

function globalDataCheck(term, value) {
    // TODO
    return {success: true, value};
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
    
    // check for cover
    let cover = processed_.resources.find(r => r.rel ? r.rel.includes("cover") : false);
    if (!cover) {
        errors.push({severity: 'validation', msg: 'Missing "cover" resource'});
    }
    
    // check durations
    if (processed_.readingOrder) {
        processed_.readingOrder.map(item => {
            if (!item.hasOwnProperty('duration')) {
                errors.push({severity: 'validation', 
                    msg: `Reading order item ${item.url} missing property "duration"`});
            }
            else if (!isValidDuration(item.duration)) {
                errors.push({severity: 'validation', 
                    msg: `Reading order item ${item.url} has invalid value for property "duration" *${item.duration}*`});
                delete item.duration;
            }
        });
    }

    if (!processed_.hasOwnProperty('duration')) {
        errors.push({severity: "validation", msg: 'Missing property "duration"'})
    }
    else {
        let totalDuration = processed_.readingOrder.reduce((acc, curr) => {
            if (curr.hasOwnProperty('duration')) {
                acc+= getDuration(curr.duration);
            }
            return acc;
        }, 0);

        let correctDuration = `PT${totalDuration.toString()}S`;
        if (correctDuration != processed_.duration) {
            errors.push({severity: "validation", msg: 'Incorrect value for top-level property "duration"'});
        }
    }
    return {"data": processed_, errors};
}

export {dataValidation};