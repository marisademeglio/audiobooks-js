import { loadManifest, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`audiobooks-js lang and dir tests`, function() {
    
    describe('Incorrect language tag and dir value (manifest-invalid-lang-dir.json)', function () {
        let filename = 'manifests/manifest-invalid-lang-dir.json';
        it(`Reports two validation errors`, async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, 'validation', 'Invalid language tag *mmm@@mmm*');
            expectError(manifest.errors, 'validation', 'Invalid direction value *xyz*');
        });
        it(`Has an empty language value`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.lang).to.equal('');
        });
        it(`Has an empty direction value`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.dir).to.equal('');
        });
    });

    describe('Processes context precedence correctly for language and direction (manifest-many-lang-dir.json)', function () {
        let filename = 'manifests/manifest-many-lang-dir.json';
        it(`Has the correct lang`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.lang).to.equal('ar');
        });
        it(`Has the correct dir`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.dir).to.equal('rtl');
        });
        it(`Has no validation errors`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.errors.filter(e=>e.severity === 'validation').length).to.equal(0);
        });
    });
    
});

