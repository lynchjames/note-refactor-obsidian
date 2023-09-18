import {describe, expect, beforeAll, afterAll} from '@jest/globals';
import { Location, NoteRefactorSettings } from '../src/settings';

const settings = new NoteRefactorSettings();
describe("Note Refactor Settings defaults", () => {

    it("New file location ", () => {
        expect(settings.newFileLocation).toBe(Location.VaultFolder);
    });

    it("Custom folder ", () => {
        expect(settings.customFolder).toBe('');
    });

    it("Exclude first line in note", () => {
        expect(settings.excludeFirstLineInNote).toBeFalsy();
    });

    it("Include first line as note heading", () => {
        expect(settings.includeFirstLineAsNoteHeading).toBeFalsy();
    });

    it("Heading format", () => {
        expect(settings.headingFormat).toBe('#');
    });
});