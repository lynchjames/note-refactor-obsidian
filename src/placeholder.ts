export class NotePlaceholders {
    newNoteTitle = new Placeholder('new_note_title');
    newNoteContent = new Placeholder('new_note_content');
    title = new Placeholder('title');
}

export class Placeholder {
    key: string;

    constructor(key: string) {
        this.key = key;
    }

    replace(input: string, value: string): string {
        return input.replace(new RegExp(`\{\{${this.key}\}\}`, 'gmi'), value);
    }
}