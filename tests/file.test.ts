import 'mocha';
import { assert } from 'chai';
import { mockDate}  from './mocks/date';
import NRFile from '../src/file';
import { NoteRefactorSettings } from '../src/settings';

let file: NRFile = null;
const date = new Date(2020, 11, 25, 11, 17, 52);


describe("File Name Prefix", () => {
    let resetDateMock:() => void;
    let settings = new NoteRefactorSettings();
    
    before(async () => {
        file = new NRFile(settings);
        resetDateMock = mockDate(date);
    });

    it("Correct prefix for YYYYMMDDHHmm", () => {
        settings.fileNamePrefix = '{{date:YYYYMMDDHHmm}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '202012251117-');
    });
    
    it("Correct prefix for YYYYMMDDHHmmss", () => {
        settings.fileNamePrefix = '{{date:YYYYMMDDHHmmss}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '20201225111752-');
    });

    it("Correct prefix for word dates YYYY-MMMM-Do_dddd", () => {
        settings.fileNamePrefix = '{{date:YYYY-MMMM-Do_dddd}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '2020-December-25th_Friday-');
    });

    it("Correct prefix for with text and date", () => {
        settings.fileNamePrefix = 'ZK_{{date:YYYYMMDDHHmm}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, 'ZK_202012251117-');
    });

    it("No date in prefix", () => {
        settings.fileNamePrefix = 'Inbox-Note-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, 'Inbox-Note-');
    });

    it("No prefix", () => {
        settings.fileNamePrefix = '';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '');
    });

    after(() => {
        resetDateMock();
    });
});

describe("File Name Sanitisation", () => {
    let fileName = '';
    let resetDateMock:() => void;
    let settings = new NoteRefactorSettings();

    before(async () => {
        file = new NRFile(settings);
        resetDateMock = mockDate(date);
    });

    it("No sanitisation should be required", () => {
        fileName = '-- This should be allowed & (e.g. £$\'=)';
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, fileName);
    });

    it("Expected internal link sanitisation", () => {
        fileName = '[[Internal Link]] to something';
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'Internal Link to something');
    });

    it("Expected external link sanitisation", () => {
        fileName = '[Obsidian](https://en.wikipedia.org/wiki/Obsidian)';
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'Obsidian(httpsen.wikipedia.orgwikiObsidian)');
    });

    it("Heading sanitisation", () => {
        fileName = '## A Heading Goes Here';
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'A Heading Goes Here');
    });

    it("Illegal file path character sanitisation (*\"\/<>:|?", () => {
        fileName = '**This has**\\/ "a lot" of <illegal>: |characters??|' ;
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'This has a lot of illegal characters');
    });

    it("Should include prefix", () => {
        fileName = '## A Heading Goes Here';
        settings.fileNamePrefix = 'ZK-{{date:YYYY-MMM-DD-HHmm}}-';
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'ZK-2020-Dec-25-1117-A Heading Goes Here');
    });

    it("Idempotent sanitisation with no duplicate prefixes", () => {
        fileName = '## A Heading Goes Here';
        settings.fileNamePrefix = 'ZK-{{date:YYYY-MMM-DD-HHmm}}-';
        let sanitised = file.sanitisedFileName(fileName);
        sanitised = file.sanitisedFileName(sanitised);
        sanitised = file.sanitisedFileName(sanitised);
        assert.equal(sanitised, 'ZK-2020-Dec-25-1117-A Heading Goes Here');
    });


    after(() => {
        resetDateMock();
    });
});