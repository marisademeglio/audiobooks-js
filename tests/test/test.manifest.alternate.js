import { loadManifest } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`pubmanifest-parse alternate tests`, function() {
    
    describe('Alternate is an array', function () {
        let filename = 'manifests/manifest-audiobook-alternate.json';
        it(`Makes alternate an array`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.readingOrder[0].alternate instanceof Array).to.equal(true);
        });
    });

});

