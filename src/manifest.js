import { ManifestProcessor } from './manifestProcessor.js';
import { fetchFile } from './utils.js';

class Manifest {
    constructor () {
        // error: {type: "parse", msg: "description"}
        // types: parse | format | profile | validation
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
            title: ''
        };
        this.readingOrderIndex = 0;
        this.toc = false;
        this.version = "0.1.2";
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
        try {
            let data = await fetchFile(url_);
            json = JSON.parse(data);
        }
        catch(err) {
            this.errors.push({severity: "fatal", msg: `${err}`});
            console.log(err);
            return;
        }
        await this.loadJson(json, url_, guessProfile);
    }

    // base is the baseUrl and has to be a string
    async loadJson(json, base = '', guessProfile = false) {
        let manifestProcessor = new ManifestProcessor();
        manifestProcessor.supportedProfiles = this.supportedProfiles;
        manifestProcessor.defaults = this.defaults;
        await manifestProcessor.loadJson(json, base, guessProfile);
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
    updateCurrentReadingOrderIndex(url) {
        if (this.data.readingOrder) {
            let idx = this.data.readingOrder.findIndex(item => item.url == url);
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
        let resource = this.data.resources.find(r => r.rel ? r.rel.includes(rel) : false);
        return resource ? resource : null;
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