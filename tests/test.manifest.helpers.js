import { Manifest } from '../src/manifest.js';
import { fetchFile } from '../src/utils.js';
const expect = chai.expect;

async function loadManifest(filename) {
    let url = new URL(`files/${filename}`, document.location.href);
    let manifest = new Manifest();
    manifest.supportedProfiles = [{
        id: 'https://www.w3.org/TR/audiobooks/',
        encodingFormats: ['audio/mpeg']
    }, {
        id: 'https://example.com/publication/',
        encodingFormats: ['text/html']
    }];
    await manifest.loadUrl(url);
    return manifest;
}

async function loadManifestGuessProfile(filename) {
    let url = new URL(`files/${filename}`, document.location.href);
    let manifest = new Manifest();
    manifest.supportedProfiles = [{
        id: 'https://www.w3.org/TR/audiobooks/',
        encodingFormats: ['audio/mpeg']
    }, {
        id: 'https://example.com/publication/',
        encodingFormats: ['text/html']
    }];
    await manifest.loadUrl(url, true);
    return manifest;
}


async function loadManifestWithDefaults(filename) {
    let url = new URL(`files/${filename}`, document.location.href);
    let manifest = new Manifest();
    manifest.supportedProfiles = [{
        id: 'https://www.w3.org/TR/audiobooks/',
        encodingFormats: ['audio/mpeg']
    }, {
        id: 'https://example.com/publication/',
        encodingFormats: ['text/html']
    }];
    manifest.defaults.lang = 'en';
    manifest.defaults.dir = 'ltr';
    await manifest.loadUrl(url);
    return manifest;
}

async function loadManifestJson(filename) {
    let url = new URL(`files/${filename}`, document.location.href);
    let manifest = new Manifest();
    manifest.setSupportedProfiles([{
        id: 'https://www.w3.org/TR/audiobooks/',
        encodingFormats: ['audio/mpeg']
    }, {
        id: 'https://example.com/publication/',
        encodingFormats: ['text/html']
    }]);
    manifest.setDefaults({
        lang: 'en',
        dir: 'ltr',
        title: 'Test title'
    });
    let fileText = await fetchFile(url);
    await manifest.loadJson(JSON.parse(fileText), url.href);
    return manifest;
}

function expectError(errors, severity, msg) {
    let err = errors.find(e=>e.severity === severity && e.msg.indexOf(msg) != -1);
    expect(err).to.not.be.undefined;
}

export {loadManifest, loadManifestGuessProfile, loadManifestWithDefaults, loadManifestJson, expectError};