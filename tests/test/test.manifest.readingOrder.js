import { loadManifest, loadManifestJson, loadManifestGuessProfile, loadManifestWithDefaults } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`pubmanifest-parse reading order tests`, function() {
    
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
});

