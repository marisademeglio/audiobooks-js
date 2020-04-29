import { loadManifest, loadManifestWithDefaults, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`audiobooks-js audiobooks spec tests`, function() {
    
    describe('Basic audiobook manifest tests (manifest-audiobook.json)', function() {
        let filename = 'manifests/manifest-audiobook.json';
        it('Has no fatal errors', async function () { 
            let manifest = await loadManifestWithDefaults(filename); 
            expect(manifest.errors.filter(e=>e.severity === 'fatal').length).to.equal(0);
        });
        it('Has the correct profile', async function () { 
            let manifest = await loadManifest(filename);   
            expect(manifest.data.profile).to.equal('https://www.w3.org/TR/audiobooks/');
        });
    });

    describe('Reports a missing TOC (manifest-audiobook-missing-toc.json)', function() {
        let filename = 'manifests/manifest-audiobook-missing-toc.json';
        it('Has property "toc=false"', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.toc).to.equal(false);
        });
        it('Reports a validation error because audiobooks are supposed to have HTML tables of contents', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.toc).to.equal(false);
            expectError(manifest.errors, "validation", "No HTML table of contents found");
        });
    });

    describe('Missing "type" property (manifest-audiobook-missing-type.json)', function() {
        let filename = 'manifests/manifest-audiobook-missing-type.json';
        it('Reports a validation error', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Missing property "type"');
        });
    });

    describe('Missing "readingOrder" property (manifest-audiobook-missing-readingOrder.json)', function() {
        let filename = 'manifests/manifest-audiobook-missing-readingOrder.json';
        it('Reports a validation error', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "fatal", 'No reading order items available');
        });
    });

    describe('Nothing available in reading order (manifest-audiobook-non-audio-readingOrder.json)', function() {
        let filename = 'manifests/manifest-audiobook-non-audio-readingOrder.json';
        it('Reports a fatal error about no reading order items available', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, 'fatal', 'No audio reading order items available');
        });
    });

    describe('Non-audio reading order (manifest-audiobook-non-audio-readingOrder-2.json)', function() {
        let filename = 'manifests/manifest-audiobook-non-audio-readingOrder-2.json';
        it('Reports a validation error about non-audio reading order items', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Non-audio reading order items encountered');
        });
    });    
    
    describe('Missing required properties (manifest-audiobook-missing-props.json)', function() {
        let filename = 'manifests/manifest-audiobook-missing-props.json';
        it('Reports a validation error about missing "abridged"', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Missing property "abridged"');
        });

        it('Reports a validation error about missing "accessMode"', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Missing property "accessMode"');
        });

        it('Reports a validation error about missing "accessModeSufficient"', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Missing property "accessModeSufficient"');
        });
    });

    describe('Missing cover (manifest-audiobook-missing-cover.json)', function() {
        let filename = 'manifests/manifest-audiobook-missing-cover.json';
        it('Reports the cover is missing', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Missing "cover" resource');
        });
    });

    describe('Durations (manifest-audiobook-bad-durations.json)', function() {
        let filename = 'manifests/manifest-audiobook-bad-durations.json';
        it('Reports a missing duration value', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 
                'Reading order item http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3 missing property "duration"');
        });
        it('Reports an invalid duration value and removes it', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 
                'Linked resource item http://www.archive.org/download/flatland_rg_librivox/flatland_2_abbott.mp3 has invalid value for property "duration" *PTxyzS*');
            let item = manifest.updateCurrentReadingOrderIndex("http://www.archive.org/download/flatland_rg_librivox/flatland_2_abbott.mp3");
            expect(item.hasOwnProperty('duration')).to.equal(false);
        });
        it('Reports an incorrect total duration', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Incorrect value for top-level property "duration"');
        });
    });

    describe("Missing duration property (manifest-audiobook-missing-props.json)", function() {
        let filename = 'manifests/manifest-audiobook-missing-props.json';

        it('Reports a missing "duration" property', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Missing property "duration"');
        });
    });

    describe("Reports no errors for correct durations (manifest-audiobook.json)", function() {
        let filename = 'manifests/manifest-audiobook.json';
        it('Has no errors', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.errors.length).to.equal(0);
        });
    })
});

