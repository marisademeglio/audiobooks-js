import { ManifestProcessor } from './manifestProcessor.js';
import { fetchFile, fetchContentType } from './utils.js';

const VERSION = '0.2.7';

class Manifest {
    constructor () {
        // error: {type: "parse", msg: "description"}
        // types: fatal, validation
        this.errors = [];
        this.data = {};
        /*
        Profile description: 
        {
            profile: 'https://www.w3/org/TR/audiobooks/',
            encodingFormats: ['audio/mpeg']
        }
        Where mediaType is the accepted format of the reading order items. Used for guessing profiles.
        */
       // set to an array of profiles (described above)
        this.supportedProfiles =[];
        
        // set to default values
        this.defaults = {
            lang: '',
            dir: '',
            title: '',
            toc: null
        };
        this.readingOrderIndex = 0;
        this.toc = false;
        this.version = VERSION;
    }
    
    setSupportedProfiles(supportedProfiles) {
        this.supportedProfiles = supportedProfiles;
    }
    setDefaults(defaults) {
        this.defaults = {...this.defaults, ...defaults};
    }
    // url can be a URL object or a string
    async loadUrl(url, guessProfile = false) {
        console.log(`Loading manifest ${url}`);
        let json;
        let url_ = typeof url === "string" ? url : url.href;
        let base = url_;
        let contentType = '';
        this.errors = [];
        try {
            contentType = await fetchContentType(url_);
            // we're opening an HTML file
            if (contentType == 'text/html') {
                let htmlFile = await fetchFile(url_); 
                if (!htmlFile) {
                    throw `Could not fetch ${url_}`;
                }
                let dom = new DOMParser().parseFromString(htmlFile, 'text/html');
                if (dom.querySelector("title") != null && dom.querySelector('title').textContent != "") {
                    this.defaults.title = dom.querySelector("title").textContent;
                }
                if (dom.querySelector("html") != null 
                    && dom.querySelector("html").hasAttribute("lang") 
                    && dom.querySelector("html").getAttribute("lang") != '') {
                    this.defaults.lang = dom.querySelector("html").getAttribute("lang");
                }
                else {
                    this.defaults.lang = "en";
                }
                if (dom.querySelector("html") != null 
                    && dom.querySelector("html").hasAttribute("dir") 
                    && dom.querySelector("html").getAttribute("dir") != '') {
                    this.defaults.dir = dom.querySelector("html").getAttribute("dir");
                }
                else {
                    this.defaults.dir = "ltr";
                }
                if (dom.querySelector("nav[role=doc-toc]")) {
                    this.defaults.toc = dom.querySelector("nav[role=doc-toc]");
                }
                
                let linkElm = dom.querySelector("link[rel='publication']");
                if (linkElm === null) {
                    throw "Publication link not found";
                }
                let manifestHref = linkElm.getAttribute('href');
                if (manifestHref[0] == '#') {
                    let embeddedManifestElm = dom.querySelector(manifestHref);
                    if (embeddedManifestElm == null) {
                        throw `Manifest at ${manifestHref} does not exist`;
                    }
                    let baseElm = dom.querySelector('base');
                    if (baseElm) {
                        base = baseElm.getAttribute('href');
                    }
                    json = JSON.parse(embeddedManifestElm.textContent);
                }
                else {
                    let linkedManifestUrl = new URL(manifestHref, url_);
                    let data = await fetchFile(linkedManifestUrl);
                    json = JSON.parse(data);
                    base = linkedManifestUrl;
                }

                // make sure that if there is no reading order, it gets set to the Document URL
                if (!json.hasOwnProperty('readingOrder')) {
                    json.readingOrder = url_;
                }

            }
            // we're opening a JSON file
            else if (contentType == 'application/ld+json' || contentType == 'application/json') {
                let data = await fetchFile(url_);
                if (!data) {
                    throw `Could not fetch ${url_}`;
                }
                json = JSON.parse(data);
            }
            else {
                throw `Content type *${contentType}* not recognized`;
            }
        }
        catch(err) {
            this.errors.push({severity: "fatal", msg: `${err}`});
            console.log(err);
            return;
        }
        await this.loadJson(json, base, guessProfile, contentType === "text/html" ? url_ : '');
    }

    // base is the baseUrl and has to be a string
    async loadJson(json, base = '', guessProfile = false, htmlUrl = '') {
        let manifestProcessor = new ManifestProcessor();
        manifestProcessor.supportedProfiles = this.supportedProfiles;
        manifestProcessor.defaults = this.defaults;
        await manifestProcessor.loadJson(json, base, guessProfile, htmlUrl);
        this.data = manifestProcessor.processed;
        this.errors = this.errors.concat(manifestProcessor.errors);
    }

    getFatalErrors() {
        return this.errors.filter(e => e.severity === "fatal");
    }
    // return the first item in [name] that matches lang
    // use global lang if not specified
    // use first item in [name] if global lang also not specified
    getTitle(lang = '') {
        return this.getL10NStringValue(this.data.name, lang);
    }

    getCover() {
        return this.getResource("cover");
    }

    getPageList() {
        return this.getResource("pagelist");
    }

    // return the HTML TOC resource
    // or, if that doesn't exist, make a list of links from the reading order
    // [{name, url}...]
    getToc() {
        if (this.hasHtmlToc()) {
            return this.getResource('contents');
        }
        else {
            if (this.data.readingOrder) {
                return this.data.readingOrder.map(item => (
                    {
                        name: this.getL10NStringValue(item.name), 
                        url: item.url
                    })
                );
            }
            else {
                return [];
            }
        }
    }
    hasHtmlToc() {
        return this.getResource('contents') != null 
            && this.getResource('contents').encodingFormat == "text/html";
    }

    getCurrentReadingOrderItem() {
        if (this.data.readingOrder && this.data.readingOrder.length > this.readingOrderIndex) {
            return this.data.readingOrder[this.readingOrderIndex];
        }
        else {
            return null;
        }
    }

    gotoNextReadingOrderItem() {
        if (this.readingOrderIndex < this.data.readingOrder.length - 1) {
            this.readingOrderIndex++;
            return this.getCurrentReadingOrderItem();
        }
        else {
            return null;
        }
    }

    gotoPrevReadingOrderItem() {
        if (this.readingOrderIndex > 0) {
            this.readingOrderIndex--;
            return this.getCurrentReadingOrderItem();
        }
        else {
            return null;
        }
    }

    // set the reading order index to the reading order item that matches this url
    // absolute and relative URLs are both ok
    updateCurrentReadingOrderIndex(url) {
        let url_ = url.indexOf("://") == -1 ? 
        new URL(url, this.data.base) : new URL(url);
    
        if (this.data.readingOrder) {
            let idx = this.data.readingOrder.findIndex(item => item.url == url_.href);
            if (idx != -1) {
                this.readingOrderIndex = idx;
                return this.getCurrentReadingOrderItem();
            }
        }
        else {
            return null;
        }
    }


    // get a resource based on its rel value
    getResource(rel) {
        if (this.data.hasOwnProperty("resources")) {
            let resource = this.data.resources.find(r => r.rel ? r.rel.includes(rel) : false);
            return resource ? resource : null;
        }
        else {
            return null;
        }
    }
    // for a localizable string, get the most sensible value, based on lang settings
    getL10NStringValue(l10nString, lang = '') {
        if (lang != '') {
            let s = l10nString.find(item => item.language === lang);
            if (s) {
                return s.value;
            }
            return l10nString[0].value;
        }
        else {
            if (this.data.lang != '') {
                let s = l10nString.find(n => n.language === this.data.lang);
                if (s) {
                    return s.value;
                }
            }
            return l10nString[0].value;
        }
    }
};

export { Manifest };