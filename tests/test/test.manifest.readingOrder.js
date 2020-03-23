import { loadManifest, loadManifestJson, loadManifestGuessProfile, loadManifestWithDefaults } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`audiobooks-js reading order tests`, function() {
    
    describe('Reading order navigation (manifest-toc.json)', function() {
        let filename = 'manifests/manifest-toc.json';
        it('Starts at the first item', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.getCurrentReadingOrderItem().url).to.equal("http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3");
        });
        it('Goes to the next item', async function() {
            let manifest = await loadManifest(filename);
            manifest.gotoNextReadingOrderItem();
            expect(manifest.getCurrentReadingOrderItem().url).to.equal("http://www.archive.org/download/flatland_rg_librivox/flatland_2_abbott.mp3");
        });
        it('Gracefully does not go past the end', async function() {
            let manifest = await loadManifest(filename);
            let i;
            let readingOrderItem;
            for(i=0; i<10; i++) {
                readingOrderItem = manifest.gotoNextReadingOrderItem();
            }
            expect(readingOrderItem).to.be.null;
        });
        it('Gracefully does not go past the beginning', async function() {
            let manifest = await loadManifest(filename);
            let readingOrderItem = manifest.gotoPrevReadingOrderItem();
            expect(readingOrderItem).to.be.null;
        });
        it('Finds an item by URL', async function() {
            let manifest = await loadManifest(filename);
            let readingOrderItem = manifest.updateCurrentReadingOrderIndex("http://www.archive.org/download/flatland_rg_librivox/flatland_7_abbott.mp3");
            expect(readingOrderItem.url).to.equal("http://www.archive.org/download/flatland_rg_librivox/flatland_7_abbott.mp3");
        }); 
    });
    
    describe('Relative urls', function() {
        let filename = 'manifests/manifest.json';
        it('Finds an item by relative URL', async function() {
            let manifest = await loadManifest(filename);
            let readingOrderItem = manifest.getCurrentReadingOrderItem();
            expect(readingOrderItem.url).to.equal(new URL('html/title.html', manifest.data.base).href);
            readingOrderItem = manifest.updateCurrentReadingOrderIndex('html/page.html');
            expect(readingOrderItem.url).to.equal(new URL('html/page.html', manifest.data.base).href);
        });
        it('Maintains the original URL in a special property', async function () {
            let manifest = await loadManifest(filename);
            let readingOrderItem = manifest.getCurrentReadingOrderItem();
            expect(readingOrderItem.hasOwnProperty('originalUrl')).to.equal(true);
            expect(readingOrderItem.originalUrl).to.equal('html/title.html');
        });
    });

    describe('Maintains the original URL', function () {
        let filename = 'manifests/manifest'
    });
});

