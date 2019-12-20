import { loadManifest, loadManifestWithDefaults } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`pubmanifest-parse data normalization tests`, function() {
    
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
            expect(manifest.data.author[0].name).to.equal('Herman Melville');
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
            expect(manifest.data.author[0].name).to.equal('Herman Melville');
            expect(manifest.data.author[1].name).to.equal('Other Person');
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
});

