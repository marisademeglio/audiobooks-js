import { loadManifest, expectError } from '../test.manifest.helpers.js';

const expect = chai.expect;

describe(`pubmanifest-parse data validation tests`, function() {
    
    describe('Data validation (manifest-missing-or-bad-props.json)', function() {
        let filename = 'manifests/manifest-missing-or-bad-props.json';
        it('Corrects a missing type', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.type[0]).to.equal('CreativeWork');
        });

        it('Reports a missing ID', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'ID not set');
        });

        it('Removes two invalid accessModeSufficient values', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.accessModeSufficient.length).to.equal(1);
        });

        it('Removes an invalid top-level duration', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.hasOwnProperty('duration')).to.equal(false);
            expectError(manifest.errors, "validation", 'Invalid value for property "duration"');

        });

        it('Removes an invalid dateModified', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.hasOwnProperty('dateModified')).to.equal(false);
        });

        it('Removes an invalid datePublished', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.hasOwnProperty('datePublished')).to.equal(false);
        });

        it('Removes an invalid inLanguage value', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.inLanguage.length).to.equal(1);
        });

        it('Corrects an invalid readingProgression value', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.readingProgression).to.equal('ltr');
        });
    });

    describe('Publication resources (manifest.json)', function() {
        let filename = "manifests/manifest.json";
        it('Collects the unique resources', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.hasOwnProperty('uniqueResources')).to.equal(true);
            expect(manifest.data.uniqueResources.length).to.equal(9);
        });
    });
    describe('Links (manifest-bad-links.json)', function() {
        let filename = "manifests/manifest-bad-links.json";
        it("Processes links correctly (manifest-bad-links.json)", async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.links[1]).to.deep.equal({
                type: ["LinkedResource"],
                url: new URL("html/supplement.html", manifest.data.base).href,
                originalUrl: 'html/supplement.html',
                rel: ["supplement"],
                encodingFormat: "text/html"
            });
            expectError(manifest.errors, "validation", `Link missing property "rel" *${new URL("images/coverThree.jpg", manifest.data.base).href}*`);
            expectError(manifest.errors, "validation", 'Invalid value for property "rel" *cover*');
        })
    });
    describe('Extending publication resources (manifest-resources.json)', function() {
        let filename = "manifests/manifest-resources.json";
        // validation error about duplicate cover
        it('Reports a validation error about a duplicate cover resource', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'Multiple resources with rel=cover');
        });

        // validation error about covers not having "name" property
        it('Reports a validation error about missing "name" property on cover resources', async function() {
            let manifest = await loadManifest(filename);
            expectError(manifest.errors, "validation", 'All image covers must have a "name" property');
        });
    });

    describe("Removes empty arrays", function() {
        let filename = "manifests/manifest-empty-arrays.json";
        it('Removes the empty array', async function() {
            let manifest = await loadManifest(filename);
            expect(manifest.data.hasOwnProperty('resources')).to.equal(false);
            expect(manifest.data.links[0].hasOwnProperty('rel')).to.equal(false);
        });
    })
});

