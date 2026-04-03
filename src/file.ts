import { FILE_NAME_REGEX, NOTE_NAME_SEPARATOR } from './constants'
import { NoteRefactorSettings } from './settings';
import MomentDateRegex from './moment-date-regex'

export default class NRFile {
    
    private settings: NoteRefactorSettings;
    private momentDateRegex: MomentDateRegex;

    constructor(setting: NoteRefactorSettings) {
        this.settings = setting;
        this.momentDateRegex = new MomentDateRegex();
    }

    sanitisedFileName(unsanitisedFilename: string): string {
      const headerRegex = FILE_NAME_REGEX;
      const prefix = this.fileNamePrefix();
      const checkedPrefix = unsanitisedFilename.startsWith(prefix) ? '' : prefix;
      return checkedPrefix + unsanitisedFilename.replace(headerRegex, '').trim().slice(0, 255);
    }

    fileNamePrefix(): string {
      return this.settings.fileNamePrefix ? this.momentDateRegex.replace(this.settings.fileNamePrefix) : '';
    }

    ensureUniqueFileNames(headingNotes: string[][], noteName?: string): string[] {
      const fileNames:string[] = [];
      const notePrefix = noteName ? noteName + NOTE_NAME_SEPARATOR : '';
      const deduped = headingNotes.map((hn) => {
        const rawName = notePrefix + hn[0];
        const fileName = this.sanitisedFileName(rawName);
        const duplicates = fileNames.filter(fn => fn == fileName);
        fileNames.push(fileName);
        return duplicates.length >= 1 ? `${fileName}${duplicates.length + 1}` : fileName;
      });
      return deduped;
    }
}