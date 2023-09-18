import { describe, expect, beforeAll, afterAll } from '@jest/globals';
import { mockDate } from './mocks/date';
import NRFile from '../src/file';
import { NoteRefactorSettings } from '../src/settings';

let file: NRFile = null;
const date = new Date(2020, 11, 25, 11, 17, 52);


describe("File Name Prefix", () => {
    let resetDateMock: () => void;
    let settings = new NoteRefactorSettings();

    beforeAll(async () => {
        file = new NRFile(settings);
        resetDateMock = mockDate(date);
    });

    it("Correct prefix for YYYYMMDDHHmm", () => {
        settings.fileNamePrefix = '{{date:YYYYMMDDHHmm}}-';
        const prefix = file.fileNamePrefix();
        expect(prefix).toBe('202012251117-');
    });

    it("Correct prefix for YYYYMMDDHHmmss", () => {
        settings.fileNamePrefix = '{{date:YYYYMMDDHHmmss}}-';
        const prefix = file.fileNamePrefix();
        expect(prefix).toBe('20201225111752-');
    });

    it("Correct prefix for word dates YYYY-MMMM-Do_dddd", () => {
        settings.fileNamePrefix = '{{date:YYYY-MMMM-Do_dddd}}-';
        const prefix = file.fileNamePrefix();
        expect(prefix).toBe('2020-December-25th_Friday-');
    });

    it("Correct prefix for with text and date", () => {
        settings.fileNamePrefix = 'ZK_{{date:YYYYMMDDHHmm}}-';
        const prefix = file.fileNamePrefix();
        expect(prefix).toBe('ZK_202012251117-');
    });

    it("No date in prefix", () => {
        settings.fileNamePrefix = 'Inbox-Note-';
        const prefix = file.fileNamePrefix();
        expect(prefix).toBe('Inbox-Note-');
    });

    it("No prefix", () => {
        settings.fileNamePrefix = '';
        const prefix = file.fileNamePrefix();
        expect(prefix).toBe('');
    });

    afterAll(() => {
        resetDateMock();
    });
});

describe("File Name Sanitisation", () => {
    let fileName = '';
    let resetDateMock: () => void;
    let settings = new NoteRefactorSettings();

    beforeAll(async () => {
        file = new NRFile(settings);
        resetDateMock = mockDate(date);
    });

    it("No sanitisation should be required", () => {
        fileName = '-- This should be allowed & (e.g. £$\'=)';
        const sanitised = file.sanitisedFileName(fileName);
        expect(sanitised).toBe(fileName);
    });

    it("Expected internal link sanitisation", () => {
        fileName = '[[Internal Link]] to something';
        const sanitised = file.sanitisedFileName(fileName);
        expect(sanitised).toBe('Internal Link to something');
    });

    it("Expected external link sanitisation", () => {
        fileName = '[Obsidian](https://en.wikipedia.org/wiki/Obsidian)';
        const sanitised = file.sanitisedFileName(fileName);
        expect(sanitised).toBe('Obsidian(httpsen.wikipedia.orgwikiObsidian)');
    });

    it("Heading sanitisation", () => {
        fileName = '## A Heading Goes Here';
        const sanitised = file.sanitisedFileName(fileName);
        expect(sanitised).toBe('A Heading Goes Here');
    });

    it("Illegal file path character sanitisation (*\"\/<>:|?", () => {
        fileName = '**This has**\\/ "a lot" of <illegal>: |characters??|';
        const sanitised = file.sanitisedFileName(fileName);
        expect(sanitised).toBe('This has a lot of illegal characters');
    });

    it("Should include prefix", () => {
        fileName = '## A Heading Goes Here';
        settings.fileNamePrefix = 'ZK-{{date:YYYY-MMM-DD-HHmm}}-';
        const sanitised = file.sanitisedFileName(fileName);
        expect(sanitised).toBe('ZK-2020-Dec-25-1117-A Heading Goes Here');
    });

    it("Idempotent sanitisation with no duplicate prefixes", () => {
        fileName = '## A Heading Goes Here';
        settings.fileNamePrefix = 'ZK-{{date:YYYY-MMM-DD-HHmm}}-';
        let sanitised = file.sanitisedFileName(fileName);
        sanitised = file.sanitisedFileName(sanitised);
        sanitised = file.sanitisedFileName(sanitised);
        expect(sanitised).toBe('ZK-2020-Dec-25-1117-A Heading Goes Here');
    });


    afterAll(() => {
        resetDateMock();
    });
});

describe("Regression - Issue #84 - File Name Duplication Protection", () => {
    let fileNames = [
        ["## Duplicate Heading", "Some text"],
        ["#### Some other heading", "Paragraph text", "", "Another paragraph"],
        ["### Test", "", "Sentence 7"],
        ["### Another test", "", "Sentence text"],
        ["## Duplicate Heading", "", "More text under heading"],
        ["# Test", "", "Testing"],
    ];
    let resetDateMock: () => void;
    let settings = new NoteRefactorSettings();

    beforeAll(async () => {
        file = new NRFile(settings);
        resetDateMock = mockDate(date);
    });

    it("Should return expected count", () => {
        const deduped = file.ensureUniqueFileNames(fileNames);
        expect(deduped.length).toBe(6);
    });

    it("Should sanitised filenames", () => {
        const deduped = file.ensureUniqueFileNames(fileNames);
        const includingHash = deduped.filter(d => d[0].includes("#"));
        expect(includingHash.length).toBe(0);
    });

    it("First duplicate should have unchanged filename", () => {
        const deduped = file.ensureUniqueFileNames(fileNames);
        expect(deduped[0]).toBe("Duplicate Heading");
    });

    it("Second duplicate should have filename with incremented number", () => {
        const deduped = file.ensureUniqueFileNames(fileNames);
        expect(deduped[4]).toBe("Duplicate Heading2");
    });

    it("Duplicate should have filename with incremented number regardless of heading level", () => {
        const deduped = file.ensureUniqueFileNames(fileNames);
        expect(deduped[5]).toBe("Test2");
    });

});