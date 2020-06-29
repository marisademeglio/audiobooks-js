const schemas = [
    'bcp.schema.json',
    'contributor-object.schema.json',
    'contributor.schema.json',
    'link.schema.json',
    'localizable-object.schema.json',
    'localizable.schema.json',
    'publication.schema.json',
    'resource.categorization.schema.json',
    'url.schema.json'
];

let ajv;
let runValidation;
let errors = [];
let data = {};
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
async function loadUrl(url) {
    let filedata = await fetch(new URL(url).href);
    let text = await filedata.text();
    let json = JSON.parse(text);
    loadJson(json);
}
function loadJson(json) {
    runValidation(json);
    errors = runValidation.errors;
    if (!errors) {
        errors = [];
    }
    data = json;
}

export { init, loadUrl, loadJson, errors, data };