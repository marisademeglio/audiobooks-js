import { loadManifest, loadManifestWithDefaults } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`audiobooks-js data normalization tests`, function() {
    
    describe('Data normalization (strings) (manifest-normalize.json)', function () {
        let filename = 'manifests/manifest-normalize.json';
        it(`Normalizes strings`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.accessMode instanceof Array).to.equal(true);
        });
        it(`Normalizes entities`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.author instanceof Array).to.equal(true);
            expect(manifest.data.author[0] instanceof Object).to.equal(true);
            expect(manifest.data.author[0].type[0]).to.equal('Person');
            expect(manifest.data.author[0].name[0].value).to.equal('Herman Melville');
        });
        it(`Normalizes localizeable strings`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.accessibilitySummary[0].value).to.equal("This is a test");
        });
        it(`Defaults to global lang and dir settings`, async function() {
            let manifest = await loadManifestWithDefaults(filename);
            expect(manifest.data.accessibilitySummary[0].language).to.equal("en");
            expect(manifest.data.accessibilitySummary[0].direction).to.equal("ltr");
        });
        it(`Normalizes linked resources`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.readingOrder[0].url).to.equal(new URL('html/title.html', manifest.data.base).href);
            expect(manifest.data.readingOrder[0].type[0]).to.equal('LinkedResource');
        })
    });

    describe('Data normalization (mixed) (manifest-normalize-2.json)', function () {
        let filename = 'manifests/manifest-normalize-2.json';
        
        it(`Normalizes entities`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.author instanceof Array).to.equal(true);
            expect(manifest.data.author[0] instanceof Object).to.equal(true);
            expect(manifest.data.author[0].type[0]).to.equal('Person');
            expect(manifest.data.author[0].name[0].value).to.equal('Herman Melville');
            expect(manifest.data.author[1].name[0].value).to.equal('Other Person');
            expect(manifest.data.author[1].type[0]).to.equal('Person');
        });
        it(`Normalizes localizeable strings`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.accessibilitySummary[0].value).to.equal("Esto es una prueba");
            expect(manifest.data.accessibilitySummary[0].language).to.equal("es");
            expect(manifest.data.accessibilitySummary[1].value).to.equal("This is a test");
        });
        it(`Defaults to global lang and dir settings`, async function() {
            let manifest = await loadManifestWithDefaults(filename);
            expect(manifest.data.accessibilitySummary[1].language).to.equal("en");
            expect(manifest.data.accessibilitySummary[1].direction).to.equal("ltr");
        });
        it(`Normalizes linked resources`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.readingOrder[0].url).to.equal(new URL('html/title.html', manifest.data.base).href);
            expect(manifest.data.readingOrder[0].type[0]).to.equal('LinkedResource');
            expect(manifest.data.readingOrder[1].url).to.equal(new URL('html/chapter1.html', manifest.data.base).href);
            expect(manifest.data.readingOrder[1].type[0]).to.equal('LinkedResource');
        })
    });

    describe('Alternate is an array', function () {
        let filename = 'manifests/manifest-audiobook-alternate.json';
        it(`Makes alternate an array`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.readingOrder[0].alternate instanceof Array).to.equal(true);
        });
    });

    describe("Removes an invalid URL", function() {
        let filename = "manifests/manifest-invalid-url.json";
        it ('Removes the invalid URL from the array, leaving one value', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.url.length).to.equal(1);
        });
    });
    describe("Removes property if all URLs are invalid", function() {
        let filename = "manifests/manifest-invalid-url2.json";
        it ('Removes the invalid URL property', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.hasOwnProperty('url')).to.equal(false);
        });
        it ('Removes the reading order item with an invalid URL', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.readingOrder.length).to.equal(1);
        });
    });
});

