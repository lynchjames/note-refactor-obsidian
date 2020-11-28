import { FILE_NAME_REGEX } from './constants'
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
}