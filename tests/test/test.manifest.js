import { loadManifest, loadManifestJson, loadManifestWithDefaults, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`pubmanifest-parse general tests`, function() {
    
    describe('Allows title and base overrides (manifest-no-title.json)', function () {
        let filename = 'manifests/manifest-no-title.json';
        it(`Reports the correct title and base`, async function() {
            let manifest = await loadManifestJson(filename);
            expect(manifest.data.base).to.equal(new URL(`files/${filename}`, document.location.href ).href);
            expect(manifest.data.name[0]['value']).to.equal('Test title');
        });
    });
    
    describe('Get title (manifest-titles.json)', function() {
        let filename = 'manifests/manifest-titles.json';
        it('Gets the first value for the title when there are no defaults given', async function() {
            let manifest = await loadManifest(filename);   
            expect(manifest.getTitle()).to.equal("El Título");
        });
        it('Gets a title that matches the global lang', async function () { 
            let manifest = await loadManifestWithDefaults(filename);   
            expect(manifest.getTitle()).to.equal("The Title");
        });
        it('Gets the title with the requested lang', async function () { 
            let manifest = await loadManifestWithDefaults(filename);   
            expect(manifest.getTitle("es")).to.equal("El Título");
        });
    });

    describe('Get cover (manifest-titles.json)', function() {
        let filename = 'manifests/manifest-titles.json';
        it('Gets the cover', async function() {
            let manifest = await loadManifest(filename);   
            expect(manifest.getCover().url).to.equal(new URL('images/cover.jpg', manifest.data.base).href) ;
        })
    });
    describe('Get toc resource (manifest-toc.json)', function() {
        let filename = 'manifests/manifest-toc.json';
        it('Has an html toc', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.hasHtmlToc()).to.equal(true);
        });
        it('Retrieves the toc resource', async function() {
            let manifest = await loadManifest(filename);
                expect(manifest.getToc()).to.deep.equal(
                {
                    rel: ["contents"],
                    url: new URL("html/toc.html", manifest.data.base).href,
                    originalUrl: 'html/toc.html',
                    type: ["LinkedResource"],
                    encodingFormat: "text/html"
                }
            )
        });
    });
    describe('Creates a toc resource if there is none (manifest-audiobook-missing-toc.json)', function() {
        let filename = 'manifests/manifest-audiobook-missing-toc.json';
        it('Does not have an html toc', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.hasHtmlToc()).to.equal(false);
        });
        it('Creates a toc resource', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.getToc()).to.deep.equal([
                {
                    "url": "http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3",
                    "name": "Part 1, Sections 1 - 3"
                  },{
                    "url": "http://www.archive.org/download/flatland_rg_librivox/flatland_2_abbott.mp3",
                    "name": "Part 1, Sections 4 - 5"
                }
            ]);
        });
    });
     
});

