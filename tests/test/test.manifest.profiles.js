import { loadManifestGuessProfile, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`pubmanifest-parse profile guessing tests`, function() {
    
    describe('Profile not recognized, resources not recognized (manifest-no-profile-not-html.json)', function () {
        let filename = 'manifests/manifest-no-profile-not-html.json';
        it(`Reports a fatal error`, async function() {
            let manifest = await loadManifestGuessProfile(filename);
            expectError(manifest.errors, "fatal", 'Could not determine profile');
        });
    });

    describe('Profile not recognized, resources recognized (manifest-no-profile.json)', function () {
        let filename = 'manifests/manifest-no-profile.json';
        it(`Reports a validation error`, async function() {
            let manifest = await loadManifestGuessProfile(filename);
            expectError(manifest.errors, "validation", 'Had to guess what profile to use');
        });
        it(`Reports the correct profile`, async function() {
            let manifest = await loadManifestGuessProfile(filename);
            expect(manifest.data.profile).to.equal('https://example.com/publication/');
        });
    });

    describe('Profile declared, no errors (manifest.json)', function() {
        let filename = 'manifests/manifest.json';
        it(`Reports no errors`, async function() {
            let manifest = await loadManifestGuessProfile(filename);
            expect(manifest.errors.length).to.equal(0);
        });
        it(`Reports the correct profile`, async function() {
            let manifest = await loadManifestGuessProfile(filename);
            expect(manifest.data.profile).to.equal('https://example.com/publication/');
        });
    });
});

