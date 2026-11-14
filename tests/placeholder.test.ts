import {describe, expect, beforeAll} from '@jest/globals';
import { NotePlaceholders } from '../src/placeholder';
let placholders = new NotePlaceholders();
let input:string = '';
let replacement:string = '';
let output: string = '';

describe("Regression - Issue 28", () => {

    beforeAll(async () => {
        input = `{{new_note_content}}`;
        replacement = 
`# Issue 28 - New Note
$$\frac{a}{b}$$

$$a^2 + b^2 = c^2$$

$\sqrt{2}$`;
    });
    
    it("Should preserve double $$ (case 1)", () => {
        output = placholders.newNoteContent.replace(input, replacement);
        expect(lineAt(output, 1)).toBe("$$\frac{a}{b}$$");
    });

    it("Should preserve double $$ (case 2)", () => {
        output = placholders.newNoteContent.replace(input, replacement);
        expect(lineAt(output, 3)).toBe("$$a^2 + b^2 = c^2$$");
    });

    it("Should preserve single $", () => {
        output = placholders.newNoteContent.replace(input, replacement);
        expect(lineAt(output, 5)).toBe("$\sqrt{2}$");
    });

});

describe("New note path", () => {
    it("Should replace {{new_note_path}} for custom wikilinks with alias", () => {
        const tpl = "[[{{new_note_path}}|{{new_note_title}}]]";
        const step1 = placholders.newNotePath.replace(tpl, "0 Inbox/Refactor Notes/K Nearest Neighbors.md");
        const step2 = placholders.newNoteTitle.replace(step1, "K Nearest Neighbors");
        expect(step2).toBe("[[0 Inbox/Refactor Notes/K Nearest Neighbors.md|K Nearest Neighbors]]");
    });

    it("Should replace {{new_note_path_encoded}}", () => {
        const tpl = "obsidian://open?path={{new_note_path_encoded}}";
        const out = placholders.newNotePathEncoded.replace(tpl, encodeURI("0 Inbox/K Nearest Neighbors.md"));
        expect(out).toBe("obsidian://open?path=0%20Inbox/K%20Nearest%20Neighbors.md");
    });
});

function lineAt(input: string, index: number): string {
    return input.split('\n')[index];
}