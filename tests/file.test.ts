import 'mocha';
import { assert } from 'chai';
import { mockDate}  from './mocks/date';
import NRFile from '../src/file';
import { NoteRefactorSettings } from '../src/settings';

const file = new NRFile(new NoteRefactorSettings);
const date = new Date(2020, 11, 25, 11, 17, 52);


describe("File Name Prefix", () => {
    let resetDateMock:() => void;

    before(async () => {
        resetDateMock = mockDate(date);
    });

    it("Correct prefix for YYYYMMDDHHmm", () => {
        file.settings.fileNamePrefix = '{{date:YYYYMMDDHHmm}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '202012251117-');
    });
    
    it("Correct prefix for YYYYMMDDHHmmss", () => {
        file.settings.fileNamePrefix = '{{date:YYYYMMDDHHmmss}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '20201225111752-');
    });

    it("Correct prefix for word dates YYYY-MMMM-Do_dddd", () => {
        file.settings.fileNamePrefix = '{{date:YYYY-MMMM-Do_dddd}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '2020-December-25th_Friday-');
    });

    it("Correct prefix for with text and date", () => {
        file.settings.fileNamePrefix = 'ZK_{{date:YYYYMMDDHHmm}}-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, 'ZK_202012251117-');
    });

    it("No date in prefix", () => {
        file.settings.fileNamePrefix = 'Inbox-Note-';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, 'Inbox-Note-');
    });

    it("No prefix", () => {
        file.settings.fileNamePrefix = '';
        const prefix = file.fileNamePrefix();
        assert.equal(prefix, '');
    });

    after(() => {
        file.settings = new NoteRefactorSettings();
        resetDateMock();
    });
});

describe("File Name Sanitisation", () => {
    let fileName = '';
    let resetDateMock:() => void;

    before(async () => {
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

    it("Illegal file path character sanitisation (*\"\/<>:|", () => {
        fileName = '*This has\\/ "a lot" of <illegal>: |characters|' ;
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'This has a lot of illegal characters');
    });

    it("With prefix", () => {
        fileName = '## A Heading Goes Here';
        file.settings.fileNamePrefix = 'ZK-{{date:YYYY-MMM-DD-HHmm}}-';
        const sanitised = file.sanitisedFileName(fileName);
        assert.equal(sanitised, 'ZK-2020-Dec-25-1117-A Heading Goes Here');
    });

    after(() => {
        file.settings = new NoteRefactorSettings();
        resetDateMock();
    });
});

describe("Path Normalization", () => {

    it("Leading forward slash should be removed", () => {
        const denormalized = '/Folder1/Folder2/My Note.md';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Multiple leading forward slashes should be removed", () => {
        const denormalized = '///Folder1/Folder2/My Note.md';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Trailing forward slash should be removed", () => {
        const denormalized = 'Folder1/Folder2/My Note.md/';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Backwards slashes should be replaced with forward slashes", () => {
        const denormalized = 'Folder1\\Folder2\\My Note.md';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Multiple trailing forward slashes should be removed", () => {
        const denormalized = 'Folder1/Folder2/My Note.md//';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Leading backward slash should be removed", () => {
        const denormalized = '\\Folder1/Folder2/My Note.md';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Multiple leading backward slashes should be removed", () => {
        const denormalized = '\\\\\\Folder1/Folder2/My Note.md';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Trailing backward slash should be removed", () => {
        const denormalized = 'Folder1/Folder2/My Note.md\\';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Multiple trailing backward slashes should be removed", () => {
        const denormalized = 'Folder1/Folder2/My Note.md\\\\';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'Folder1/Folder2/My Note.md');
    });

    it("Correct root path should be returned", () => {
        const denormalized = '';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, '/');
    });

    it("File protocol (file:///) should be preserved", () => {
        const denormalized = 'file:///Folder1/Folder2/My Note.md';
        const normalized = file.normalizePath(denormalized);
        assert.equal(normalized, 'file:///Folder1/Folder2/My Note.md');
    });

});