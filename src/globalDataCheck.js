import {TermDefs} from './termDefs.js';

let errors = [];

function globalDataCheck(processed) {
    errors = [];
    let data = checkObject(processed);
    return {data, errors};
}
function checkObject(obj) {
    let obj_ = obj;
    Object.keys(obj_).map(key => {
        let retval = checkTerm(key, obj_[key]);
        if (retval != null) {
            obj_[key] = retval;
        }
        else {
            errors.push({severity: 'validation', msg: `Term ${key} failed global data check and has been removed`});
            delete obj_[key];
        }
    });
    return obj_;
}
function checkTerm(term, value) {
    if (TermDefs.ARRAY_OF_ENTITIES.includes(term) || 
        TermDefs.ARRAY_OF_L10N_STRINGS.includes(term) ||
        TermDefs.ARRAY_OF_LINKED_RESOURCES.includes(term) ||
        TermDefs.ARRAY_OF_LITERALS.includes(term)) {

        if (value instanceof Array) {
            // check each value in the array
           if (TermDefs.ARRAY_OF_ENTITIES.includes(term) ||
               TermDefs.ARRAY_OF_L10N_STRINGS.includes(term) ||
               TermDefs.ARRAY_OF_LINKED_RESOURCES.includes(term)) {
                // recursively check each object property
                let filteredArray = value.map(v => checkObject(v)).filter(v => v != {});
                return filteredArray.length > 0 ? filteredArray : null;
            }
            else {
                // it's an array of literals
                let stringValues = value.filter(v => typeof v === 'string');

                if (stringValues.length != value.length) {
                    errors.push({severity: "validation", msg: `Array of literals expected for ${term}`});
                    return stringValues;
                }
                else {
                    return value;
                }
            }
        }
        else {
            errors.push({severity: "validation", msg: `Array expected for ${term}`});
            return null;
        }
    }
    if (TermDefs.BOOLEANS.includes(term)) {
        if (value != true && value != false) {
            errors.push({severity: "validation", msg: `Boolean expected for ${term}`});
            return null;
        }
        else {
            return value;
        }
    }
    if (TermDefs.IDENTIFIERS.includes(term) || 
             TermDefs.LITERALS.includes(term) ||
             TermDefs.URLS.includes(term)) {
        // URLs also need to allow arrays for when 'url' is a top level property
        if (typeof value != 'string' && !(value instanceof Array)) {
            errors.push({severity: "validation", msg: `String or Array expected for ${term}`});
            return null;
        }
        else {
            return value;
        }
    }
    return value;
}

export {
    globalDataCheck
};