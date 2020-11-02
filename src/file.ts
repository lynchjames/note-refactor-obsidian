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
      const headerRegex = /[#*"\/\\<>:|\[\]]/gim;
      const prefix = this.fileNamePrefix();
      const checkedPrefix = unsanitisedFilename.startsWith(prefix) ? '' : prefix;
      return checkedPrefix + unsanitisedFilename.replace(headerRegex, '').trim().slice(0, 255);
    }

    fileNamePrefix(): string {
      return this.settings.fileNamePrefix ? this.momentDateRegex.replace(this.settings.fileNamePrefix) : '';
    }
  
    normalizePath(path: string) : string {
        // Always use forward slash
        path = path.replace(/\\/g, '/');
  
        // Strip start/end slash
        while (path.startsWith('/') && path !== '/') {
            path = path.substr(1);
        }
        while (path.endsWith('/') && path !== '/') {
            path = path.substr(0, path.length - 1);
        }
        
        // Use / for root
        if (path === '') {
            path = '/';
        }
    
        path = path
            // Replace non-breaking spaces with regular spaces
            .replace('\u00A0', ' ')
            // Normalize unicode to NFC form
            .normalize('NFC');
        
        return path;
    }
}