import { assert } from 'chai';
import NRDoc from '../src/doc';
import { NoteRefactorSettings } from '../src/settings';
import { promises as fs } from 'fs';
const newLocal = './tests/files/test-note.md';
let doc: NRDoc = null;
let fileContents:string = '';
let content: string[] = [];

describe("Note content - Content Only", () => {

    beforeAll(async () => {
        fileContents = await loadTestFile();
        content = toArray(fileContents, 0, 15);
        doc = new NRDoc(new NoteRefactorSettings(), undefined, undefined);
    });

    it("First line content", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(firstLine(noteContent), "Hi there! I'm a note in your vault.");
    });

    it("Last line content", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(lastLine(noteContent), "- How to [[Working with multiple notes|open multiple files side by side]]");
    });

    it("Character count", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(noteContent.length, 746);
    });

});

describe("Note content - Content Only - Normalize header levels", () => {

    beforeAll(async () => {
        fileContents = await loadTestFile();
        content = toArray(fileContents, 42, 51);
        const settings = new NoteRefactorSettings();
        settings.normalizeHeaderLevels = true;
        doc = new NRDoc(settings, undefined, undefined);
    });

    it("First line content", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(firstLine(noteContent), "# I have questions.");
    });

    it("Header 3 content", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(toArray(noteContent)[4], "## Header 3");
    });

    it("Last line content", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(lastLine(noteContent), "This is for testing normalizing header levels.");
    });

    it("Character count", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1), true);
        assert.equal(noteContent.length, 232);
    });

});

describe("Note content - First Line as File Name, exclude first line", () => {

    beforeAll(async () => {
        fileContents = await loadTestFile();
        const settings = new NoteRefactorSettings();
        settings.excludeFirstLineInNote = true;
        doc = new NRDoc(settings, undefined, undefined);
        content = toArray(fileContents, 0, 15);
    });
    
    it("First Line text", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(firstLine(noteContent), "At the same time, I'm also just a Markdown file sitting on your hard disk. It's all in plain text, so you don't need to worry about losing me in case [[Obsidian]] disappears one day.");
    });

    it("Last line text", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(lastLine(noteContent), "- How to [[Working with multiple notes|open multiple files side by side]]");
    });

    it("External links preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[9], '- How to use [Markdown](https://www.markdownguide.org) to [[Format your notes]]');
    });
    
    it("Embeds preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[7], '- How to ![[Create notes|create new notes]].');
    });

    it("Character count", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(noteContent.length, 709);
    });

});

describe("Note content - First Line as File Name, first line as heading", () => {
    let fileContents:string = '';
    let content: string[] = [];

    beforeAll(async () => {
        fileContents = await loadTestFile();
        const settings = new NoteRefactorSettings();
        settings.includeFirstLineAsNoteHeading = true;
        settings.headingFormat = '#';
        doc = new NRDoc(settings, undefined, undefined);
        content = toArray(fileContents, 0, 15);
    });
    
    it("First Line text", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(firstLine(noteContent), "# Hi there! I'm a note in your vault.");
    });

    it("Last line text", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(lastLine(noteContent), "- How to [[Working with multiple notes|open multiple files side by side]]");
    });

    it("External links preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[11], '- How to use [Markdown](https://www.markdownguide.org) to [[Format your notes]]');
    });
    
    it("Embeds preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[9], '- How to ![[Create notes|create new notes]].');
    });

    it("Character count", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(noteContent.length, 748);
    });

});

describe("Note content - First Line as File Name, first line as heading (modified heading)", () => {

    beforeAll(async () => {
        fileContents = await loadTestFile();
        const settings = new NoteRefactorSettings();
        settings.includeFirstLineAsNoteHeading = true;
        settings.headingFormat = '#';
        doc = new NRDoc(settings, undefined, undefined);
        content = toArray(fileContents, 4, 28);
    });
    
    it("First Line text", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(firstLine(noteContent), "# Quick Start");
    });

    it("Last line text", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(lastLine(noteContent), "## Workflows");
    });
    
    it("Internal links preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[9], '- [[Keyboard shortcuts]]');
    });
    
    it("External links preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[18], 'If you are a [Catalyst supporter](https://obsidian.md/pricing), and want to turn on Insider Builds, see [[Insider builds]].');
    });
    
    it("Embeds preserved", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(toArray(noteContent)[20], '![Obsidian.md](https://obsidian.md/images/screenshot.png)');
    });

    it("Character count", () => {
        const noteContent = doc.noteContent(content[0], content.slice(1));
        assert.equal(noteContent.length, 1105);
    });

});


async function loadTestFile(): Promise<string> {
    return await fs.readFile(newLocal, 'utf8');
}

function toArray(input:string, start?:number, end?:number): string[] {
    const output = input.split('\n');
    return output.slice(start, end);
}

function firstLine(input:string): string {
    const items = input.split('\n');
    return items[0];
}

function lastLine(input:string): string {
    const items = input.split('\n');
    return items[items.length - 1];
}
