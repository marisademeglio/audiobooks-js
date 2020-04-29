import {TermDefs} from './termDefs.js';

let errors = [];
// test out all the URLs to make sure we can work with them
// if they are valid, make them into URL objects
function validateUrlsAndRenormalize(data) {
    errors = [];
    data = scanProperties(data, data.base);

    // Renormalize:
    // remove any LinkedResources that are now missing urls (because we removed invalid properties in the steps below)
    if (data.hasOwnProperty('links')) {
        data['links'] = removeItemsWithNoUrl(data['links']);
    }
    if (data.hasOwnProperty('readingOrder')) {
        data['readingOrder'] = removeItemsWithNoUrl(data['readingOrder']);
    }
    if (data.hasOwnProperty('resources')) {
        data['resources'] = removeItemsWithNoUrl(data['resources']);
    }

    return {data, errors};
}

function removeItemsWithNoUrl(linkedResources) {
    let items_ = linkedResources.filter(item => item.hasOwnProperty('url'));
    if (items_.length != linkedResources.length) {
        errors.push({severity: 'validation', msg: "LinkedResource removed"});
    }
    return items_;
}
function scanProperties(obj, base) {
    let data = obj;
    Object.keys(data).map(key => {
        if (typeof data[key] === 'string' && TermDefs.URLS.includes(key)) {
            let result = checkUrl(data[key], base);
            if (!result) {
                delete data[key];
            }
            else {
                data[key] = result;
            }
        }
        else if (data[key] instanceof Array) {
            data[key] = data[key].map(item => {
                if (typeof item === 'string' && TermDefs.URLS.includes(key)) {
                    return checkUrl(item, base);
                }
                else if (item instanceof Object) {
                    return scanProperties(item, base);
                }
                else {
                    return item;
                }
            })
            .filter(item => item != null);
        }
        else if (data[key] instanceof Object) {
            data[key] = scanProperties(data[key]);
        }
    });
    return data;
}

function checkUrl(url, base) {
    let url_;
    try {
        url_ = new URL(url, base).href;
    }
    catch (err) {
        errors.push({severity: "validation", msg: `Invalid URL ${url}`});
        return null;
    }
    return url_;
}

export { validateUrlsAndRenormalize };