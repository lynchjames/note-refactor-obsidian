export class NotePlaceholders {
    newNoteTitle = new Placeholder('new_note_title');
    newNoteLink = new Placeholder('new_note_link');
    newNotePath = new Placeholder('new_note_path');
    newNotePathEncoded = new Placeholder('new_note_path_encoded');
    newNoteContent = new Placeholder('new_note_content');
    title = new Placeholder('title');
    link = new Placeholder('link');
}

export class Placeholder {
    key: string;

    constructor(key: string) {
        this.key = key;
    }

    replace(input: string, value: string): string {
        return input.replace(new RegExp(`\{\{${this.key}\}\}`, 'gmi'), () => value);
    }
}