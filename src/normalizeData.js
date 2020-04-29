import {TermDefs} from './termDefs.js';

let errors = [];
function normalize(manifest, processed) {
    errors = [];
    let processed_ = processed;
    Object.keys(manifest).map(key => {
        let retval = normalizeData(key, manifest[key], processed.lang, processed.dir);
        if (retval.success) {
            processed_[key] = retval.value;
        }
    });
    return {data: processed_, errors};
}
function normalizeData(term, value, lang, dir) {
    if (term == '@context') {
        return {success: false, value: null, errors};
    }
    if (TermDefs.ARRAY_OF_LITERALS.includes(term)) {
        return {
            success: true, 
            value: typeof value === "string" ? [value] : value
        };
    }
    if (TermDefs.ARRAY_OF_ENTITIES.includes(term)) {
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
            let namedEntities = entities.filter(e => e!=null && e.hasOwnProperty("name"));
            if (namedEntities.length != entities.length) {
                errors.push({severity: "validation", msg: "Entity missing required property 'name'."});
            }
            let i;
            for (i=0; i<namedEntities.length; i++) {
                let normName = normalizeData("name", entities[i].name, lang, dir);
                if (normName.success) {
                    namedEntities[i].name = normName.value;
                }
            }
            return {
                success: true,
                value: namedEntities
            };
        }
        else {
            return {
                success: false,
                value: null
            };
        }
    }
    if (TermDefs.ARRAY_OF_L10N_STRINGS.includes(term)) {
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
    if (TermDefs.ARRAY_OF_LINKED_RESOURCES.includes(term)) {
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
                        let retval = normalizeData(key, v[key], lang, dir);
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
        return {
            success: false,
            value: null
        };
    }
    // we purposely don't process URLs here, we do it in a separate step
    // which allows us to also catch the URL properties on LinkedResources
    
    // else pass it through
    else {
        return {'success': true, 'value': value};
    }
}

export {normalize};