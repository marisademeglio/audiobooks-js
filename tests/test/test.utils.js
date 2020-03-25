import { fetchFile, fetchContentType, isAudioFormat, isValidDuration, isValidDate, getDurationInSeconds } from '../../src/utils.js';
const expect = chai.expect;

describe(`Utils`, function() {
    describe('Fetch file that exists (sample.json)', function () {
        it('returns a string containing the file', async function () {    
            let data = await runFetchFile('utils/sample.json');
            expect(data).to.equal('{\n    "property": "value"\n}');
        });
    });
    describe(`Fetch file that doesn't exist`, function () {
        it('returns an empty string', async function () {    
            let data = await runFetchFile('utils/doesntexist.json');
            expect(data).to.equal('');
        });
    });
    describe(`Determine content types`, function () {
        it('Identifies text/html', async function () {    
            let data = await runFetchContentType('utils/sample.html');
            expect(data).to.equal('text/html');
        });
        it('Identifies mp3', async function () {    
            let data = await runFetchContentType('utils/sample.mp3');
            expect(data).to.equal('audio/mpeg');
        });
        it('Handles an unknown file type', async function() {
            let data = await runFetchContentType('utils/sample.unknown');
            expect(data).to.equal('application/octet-stream');
        });
    });

    describe("Reports whether a string is an audio format", function() {
        it("audio/mpeg is an audio format", async function() {
            let res = isAudioFormat("audio/mpeg");
            expect(res).to.equal(true);
        });
        it("application/pdf is not an audio format", async function() {
            let res = isAudioFormat("application/pdf");
            expect(res).to.equal(false);
        });
        
    });

    describe("Identifies and parses duration values", function() {
        it("PTS is not a duration", async function() {
            let res = isValidDuration("PTS");
            expect(res).to.equal(false);
            res = getDurationInSeconds("PTS");
            expect(res).to.equal(0);
        });
        it("PTddS is not a duration", async function() {
            let res = isValidDuration("PTddS");
            expect(res).to.equal(false);
            res = getDurationInSeconds("PTddS");
            expect(res).to.equal(0);
        });
        it("1234S is not a duration", async function() {
            let res = isValidDuration("1234S");
            expect(res).to.equal(false);
            res = getDurationInSeconds("1234S");
            expect(res).to.equal(0);
        });
        it("00:44:22 is not a duration", async function() {
            let res = isValidDuration("00:44:22");
            expect(res).to.equal(false);
            res = getDurationInSeconds("00:44:22");
            expect(res).to.equal(0);
        });
        it("PT12345S is a duration of 12345 seconds", async function() {
            let res = isValidDuration("PT12345S");
            expect(res).to.equal(true);
            res = getDurationInSeconds("PT12345S");
            expect(res).to.equal(12345);
        });
        it("PT4S is a duration of 4 seconds", async function() {
            let res = isValidDuration("PT4S");
            expect(res).to.equal(true);
            res = getDurationInSeconds("PT4S");
            expect(res).to.equal(4);
        });
        
    });

    describe("Reports whether a date is in the correct format", function() {
        it("'Halloween 2019' is not a valid date", async function() {
            expect(isValidDate('Halloween 2019')).to.equal(false);
        });
        it("'2020-14-35' is not a valid date", async function() {
            expect(isValidDate('2020-14-35')).to.equal(false);
        });
        it("'2019-08-14' is a valid date", async function() {
            expect(isValidDate('2019-08-14')).to.equal(true);
        });
        it("'2018-02-10T17:00:00Z' is a valid date", async function() {
            expect(isValidDate('2018-02-10T17:00:00Z')).to.equal(true);
        })
    });
    
});

async function runFetchFile(file) {
    let url = new URL(`files/${file}`, document.location.href);
    console.log("Fetching file", url.toString());   
    return await fetchFile(url.toString());
}

async function runFetchContentType(file) {
    let url = new URL(`files/${file}`, document.location.href);
    console.log("Fetching file", url.toString());   
    return await fetchContentType(url);
}