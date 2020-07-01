const schemas = [
    'bcp.schema.json',
    'contributor-object.schema.json',
    'contributor.schema.json',
    'ItemList.schema.json',
    'link.schema.json',
    'localizable-object.schema.json',
    'localizable.schema.json',
    'publication.schema.json',
    'resource.categorization.schema.json',
    'url.schema.json',
    'audiobooks.schema.json'
];

let ajv;
let runValidation;
let errors = [];
let data = {};
let validationMode = "AUDIO";

async function init() {
    ajv = new Ajv({ allErrors: true, coerceTypes: 'array'});
    let schemaObjects = await Promise.all(
        schemas.map(async schemaFile => {
            let filedata = await fetch(new URL('./schema/' + schemaFile, document.location.href).href);
            let text = await filedata.text();
            let schema = JSON.parse(text);
            return schema;
        })
    );

    ajv.addMetaSchema(schemaObjects);
    runValidation = ajv.getSchema('publication.schema.json');
}
// mode = PUB or AUDIO
function setMode(mode) {
    validationMode = mode;
}
async function loadUrl(url) {
    let filedata = await fetch(new URL(url).href);
    let text = await filedata.text();
    let json = JSON.parse(text);
    loadJson(json);
}
function loadJson(json) {
    if (validationMode == "AUDIO") {
        runValidation = ajv.getSchema('audiobooks.schema.json');
    }
    runValidation(json);
    errors = runValidation.errors;
    if (!errors) {
        errors = [];
    }
    data = json;
}

export { init, loadUrl, loadJson, setMode, errors, data };