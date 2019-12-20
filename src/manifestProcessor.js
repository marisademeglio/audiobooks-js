import { fetchFile, fetchContentType, isValidLanguageTag } from './utils.js';
import {normalizeData} from './normalizeData.js';
import {dataValidation} from './dataValidation.js';

const AUDIOBOOKS_PROFILE = "https://www.w3.org/TR/audiobooks/";

class ManifestProcessor {
    constructor () {
        // error: {severity: "fatal|validation", msg: "description"}
        this.errors = [];
        this.json = {};
        this.processed = {};
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
        
        this._readingOrderItems = [];
    }
    
    async loadJson(json, base = '', guessProfile = false) {
        this.json = json;
        if (!this.processed.hasOwnProperty('base')) {
            this.processed.base = '';
        }
        if (this.processed.base == '' && base != '') {
            this.processed.base = base;
        }

        try {
            this.checkContext();
            this.checkReadingOrder();
        }
        catch(err) {
            this.errors.push({severity: "fatal", msg: `${err}`});
            return;
        }

        try {
            await this.setProfile(guessProfile);
        }
        catch(err) {
            this.errors.push({severity: "fatal", msg: `${err}`});
            return;
        }

        this.setGlobalLangAndDir();

        // the reading order is partially normalized already; start where we left off
        let _manifest = {...this.json, readingOrder: this._readingOrderItems};
        // insert a title in case we add a user-defined default (read on...)
        if (!_manifest.hasOwnProperty('name')) {
            _manifest.name = '';
        }
        Object.keys(_manifest).map(key => {
            let retval = normalizeData(key, _manifest[key], 
                this.processed.lang, this.processed.dir, this.processed.base);
            if (retval.success) {
                this.processed[key] = retval.value;
            }
        });
        
        if (this.processed.name[0].value == '' && this.defaults.title != '') {
            this.processed.name[0].value = this.defaults.title;
        }

        if (this.processed.profile == AUDIOBOOKS_PROFILE) {  
            try {
                await this.audiobooksProcessing();    
            }  
            catch(err) {
                this.errors.push({severity: "fatal", msg: `${err}`});
            }
        }  

        let {data: processed_, errors: errors_} = dataValidation(this.processed);
        this.processed = processed_;
        this.errors = this.errors.concat(errors_);
    }

    checkContext() {
        if (this.json.hasOwnProperty('@context')) {
            if (this.json['@context'] instanceof Array) {
                if (this.json['@context'].length >= 2 && 
                    (this.json['@context'][0] != "https://schema.org" || 
                        this.json['@context'][1] != "https://www.w3.org/ns/pub-context")) {
                        throw 'Property "@context" does not contain the required values';
                }
            }   
            else {
                throw 'Property "@context" is not an Array';
            }   
        }
        else {
            throw 'Missing property "@context"';
        }
    }

    checkReadingOrder() {
        if (!this.json.hasOwnProperty('readingOrder')) {
            throw 'Missing property "readingOrder"';  
        }
        // this would be taken care of by 'normalize' except that doesn't happen until later
        // and some things we'd like to know now (in the case of guessing the profile)
        if (typeof this.json.readingOrder === "string") {
            this.json.readingOrder = [this.json.readingOrder];
        }
        // make an intermediate list of reading order objects
        this._readingOrderItems = this.json.readingOrder.map(item => {
            let itemObj = typeof item === "string" ? {url: item} : item;
            return itemObj;
        });
    }

    setGlobalLangAndDir() {
        let contexts = this.json['@context'].filter(item => item instanceof Object);
        contexts.map(context => {
            if (context.hasOwnProperty('language')) {
                this.processed.lang = context.language;
            }
            if (context.hasOwnProperty('direction')) {
                this.processed.dir = context.direction;
            }
        });
        if (!isValidLanguageTag(this.processed.lang)) {
            this.errors.push({severity: 'validation', msg: `Invalid language tag *${this.processed.lang}*`});
            this.processed.lang = '';
        }
        if (['rtl', 'ltr'].includes(this.processed.dir) == false) {
            this.errors.push({severity: 'validation', msg: `Invalid direction value *${this.processed.dir}*`});
            this.processed.dir = '';
        }
        if (this.processed.lang == '') {
            this.processed.lang = this.defaults.lang;
        }
        if (this.processed.dir == '') {
            this.processed.dir = this.defaults.dir;
        }
    }

    async setProfile(guessProfile = false) {
        let profiles = this.json.conformsTo instanceof Array ? 
            this.json.conformsTo : [this.json.conformsTo];
        
        let supportedProfileIds = this.supportedProfiles.map(profile => profile.id);

        let supportedProfileId = profiles.find(p => supportedProfileIds.includes(p));
        
        if (supportedProfileId) {
            // use the first declared profile that's supported
            this.processed.profile = supportedProfileId;
        }
        else {
            if (guessProfile) {
                // look at the readingOrder and guess
                let profile = await this.guessProfile();
                if (profile) {
                    this.processed.profile = profile.id;
                    this.errors.push({severity: "validation", msg: 'Had to guess what profile to use'})
                }
                else {
                    throw 'Could not determine profile';
                }
            }
            else {
                throw 'Could not determine profile';
            }
        }   
    }

    async guessProfile() {
        console.log("Guessing profile");
        this._readingOrderItems = await this.getEncodingFormats(this._readingOrderItems);
        let presentMediaTypes = Array.from(new Set(this._readingOrderItems.map(item => item.encodingFormat)));
        let profile = this.supportedProfiles.find(profile => {
            return !presentMediaTypes.map(mediaType => profile.encodingFormats.includes(mediaType)).includes(false);
        });
        return profile != undefined ? profile : null;
    }

    async getEncodingFormats(items) {
        return Promise.all(items.map(async item => {
            let contentType = await fetchContentType(new URL(item.url, this.processed.base));
            console.log(contentType);
            return {...item, encodingFormat: contentType};
        }));
    }

    
    // extended processing rules for audiobooks
    // https://www.w3.org/TR/audiobooks/#audio-manifest-processing
    async audiobooksProcessing() {
        // check for TOC
        let toc = this.processed.resources.find(r => r.rel ? r.rel.includes("contents") : false);
        if (toc != undefined) {
            let tocFile = await fetchFile(toc.url);
            const parser = new DOMParser();
            const tocDoc = parser.parseFromString(tocFile, "text/html");
            this.processed.toc = tocDoc.documentElement.querySelector("[role=doc-toc]") != undefined;
        }
        else {
            this.processed.toc = false;
        }
        if (!this.processed.toc) {
            this.errors.push({severity: "validation", msg: 'No HTML table of contents found'})
        }
    }
};

export { ManifestProcessor };