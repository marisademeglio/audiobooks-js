import {TermDefs} from './termDefs.js';

function normalizeData(term, value, lang, dir, base) {
    if (term == '@context') {
        return {success: false, value: null};
    }
    else if (TermDefs.ARRAY_OF_LITERALS.includes(term)) {
        return {
            success: true, 
            value: typeof value === "string" ? [value] : value
        };
    }
    else if (TermDefs.ARRAY_OF_ENTITIES.includes(term)) {
        if (typeof value === "string" || value instanceof Array) {
            let val = typeof value === "string" ? [{name: value}] : value;

            let entities = val.map (item => {
                if (typeof item === "string" || item instanceof Object) {
                    let v = typeof item === "string" ? {name: item} : item;
                    if (!v.hasOwnProperty('type')) {
                        v = {...v, type: ['Person']};
                    }
                    else {
                        if (typeof v.type === "string") {
                            v = {...v, type: [v.type]};
                        }
                    }
                    if (!v.type.includes('Person')) {
                        v = {...v, type: v.type.concat('Person')};
                    }
                    return v;
                }
                else {
                    return null;
                }
            });
            entities = entities.filter(e => e!=null);
            return {
                success: true,
                value: entities
            };
        }
        else {
            return {
                success: false,
                value: null
            };
        }
    }
    else if (TermDefs.ARRAY_OF_L10N_STRINGS.includes(term)) {
        if (typeof value === "string" || value instanceof Array) {
            let val = typeof value === "string" ? [{value: value}] : value;

            let entities = val.map (item => {
                if (typeof item === "string" || item instanceof Object) {
                    let v = typeof item === "string" ? {value: item} : item;
                    if (!v.hasOwnProperty('language')) {
                        v = {...v, language: lang};
                    }
                    if (!v.hasOwnProperty('direction')) {
                        v = {...v, direction: dir};
                    }
                    if (v.language == '') {
                        delete v.language;
                    }
                    if (v.direction == '') {
                        delete v.direction;
                    }
                    return v;
                }
                else {
                    return null;
                }
            });
            entities = entities.filter(e => e!=null);
            return {
                success: true,
                value: entities
            };
        }
        else {
            return {
                success: false,
                value: null
            };
        }
    }
    else if (TermDefs.ARRAY_OF_LINKED_RESOURCES.includes(term)) {
        if (typeof value === "string" || value instanceof Array || value instanceof Object) {
            let val = typeof value === "string" ? [{url: value}] : value;
            if (val instanceof Object && !(val instanceof Array)) {
                val = [val];
            }

            let entities = val.map (item => {
                if (typeof item === "string" || item instanceof Object) {
                    let v = typeof item === "string" ? {url: item} : item;
                    if (!v.hasOwnProperty('type')) {
                        v = {...v, type: ['LinkedResource']};
                    }
                    else {
                        if (typeof v.type === "string") {
                            v = {...v, type: [v.type]};
                        }
                    }
                    if (!v.type.includes('LinkedResource')) {
                        v = {...v, type: v.type.concat('LinkedResource')};
                    }
                    if (v.hasOwnProperty('url')) {
                        v.originalUrl = v.url; // save the original URL in case we want a relative value
                    }
                    Object.keys(v).map(key => {
                        let retval = normalizeData(key, v[key], lang, dir, base);
                        if (retval.success) {
                            v[key] = retval.value;
                        }
                    });
                    return v;
                }
                else {
                    return null;
                }
            });
            entities = entities.filter(e => e!=null);
            return {
                success: true,
                value: entities
            };
        }
        else {
            return {
                success: false,
                value: null
            };
        }
    }
    // URLs are weird because at the top level, they can be in arrays
    // but at the object (e.g. linked resource) level, they are just strings
    // so: if it's an array, keep it like that; else don't make it one.
    else if (TermDefs.URLS.includes(term)) {
        if (value instanceof Array) {
            value = value.map(v => new URL(v, base).href);
        }
        else {
            value = new URL(value, base).href;
        }
        return {
            success: true,
            value: value
        };
    }
    // pass it through
    else {
        return {'success': true, 'value': value};
    }
}

export {normalizeData};