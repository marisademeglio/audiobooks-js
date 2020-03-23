import { loadManifest, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`audiobooks-js context tests`, function() {
    
    describe(`Property @context missing (manifest-context-missing.json)`, function() {
        let filename = 'manifests/manifest-context-missing.json';
        it(`Reports a fatal error`, async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "fatal", 'Missing property "@context"');
        });
    });
    
    describe(`Property @context is not an array (manifest-context-not-array.json)`, function () {
        let filename = 'manifests/manifest-context-not-array.json';
        it(`Reports a fatal error`, async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "fatal", 'Property "@context" is not an Array');
        });
    });

    describe('Property @context has wrong values (manifest-context-wrong-values.json)', function () {
        let filename = 'manifests/manifest-context-wrong-values.json';
        it(`Reports a fatal error`, async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "fatal", 'Property "@context" does not contain the required values');
        });
        
    });
});

