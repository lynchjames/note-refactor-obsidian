import 'mocha';
import { assert } from 'chai';
import { Location, NoteRefactorSettings } from '../src/settings';

const settings = new NoteRefactorSettings();
describe("Note Refactor Settings defaults", () => {

    it("New file location ", () => {
        assert.equal(settings.newFileLocation, Location.VaultFolder);
    });

    it("Custom folder ", () => {
        assert.equal(settings.customFolder, '');
    });

    it("Exclude first line in note", () => {
        assert.isFalse(settings.excludeFirstLineInNote);
    });

    it("Include first line as note heading", () => {
        assert.isFalse(settings.includeFirstLineAsNoteHeading);
    });

    it("Heading format", () => {
        assert.equal(settings.headingFormat, '#');
    });
});