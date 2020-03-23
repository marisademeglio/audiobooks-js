import { loadManifest, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`audiobooks-js loading tests`, function() {
    describe('Invalid json input (manifest-not-json.json)', function () {
        let filename = 'manifests/manifest-not-json.json';
        it('Reports a fatal error', async function () {    
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, 'fatal', 
                'SyntaxError: JSON.parse: unterminated string at line 30 column 25 of the JSON data');
        });
        it('Has an empty processed manifest', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data).to.be.empty;
        });
    });

    describe('Valid json input (manifest.json)', function () {
        let filename = 'manifests/manifest.json';
        it('Has no errors', async function () { 
            let manifest = await loadManifest(filename);   
            expect(manifest.errors.length).to.equal(0);
        });
        it('Has a non-empty processed manifest', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data).to.be.not.empty;
        });
        it('Has the correct base url', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.base).to.equal(new URL(`files/${filename}`, document.location.href).href);
        });
        it(`Reports the correct profile`, async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.profile).to.equal('https://example.com/publication/');
        });
    });


});