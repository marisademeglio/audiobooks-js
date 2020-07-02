const schemas = [
    "module/bcp.schema.json",
    "module/context.schema.json",
    "module/contributor-object.schema.json",
    "module/contributor.schema.json",
    "module/date.schema.json",
    "module/duration.schema.json",
    "module/item-lists.schema.json",
    "module/ItemList.schema.json",
    "module/language.schema.json",
    "module/link.schema.json",
    "module/localizable-object.schema.json",
    "module/localizable.schema.json",
    "module/resource.categorization.schema.json",
    "module/strings.schema.json",
    "module/url.schema.json",
    "module/urls.schema.json",
    "publication.schema.json",
    "audiobooks.schema.json"
];

let ajv;
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
    let runValidation = validationMode === "AUDIO" ? 
        ajv.getSchema('audiobooks.schema.json') 
        : ajv.getSchema('publication.schema.json');
    
    runValidation(json);
    errors = runValidation.errors;
    if (!errors) {
        errors = [];
    }
    data = json;
}

export { init, loadUrl, loadJson, setMode, errors, data };