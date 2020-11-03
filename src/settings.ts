import { HEADING_FORMAT } from './constants';

export class NoteRefactorSettings {
    includeFirstLineAsNoteHeading: boolean = false;
    excludeFirstLineInNote: boolean = false;
    headingFormat: string = HEADING_FORMAT;
    newFileLocation: Location = Location.VaultFolder;
    customFolder: string = '';
    fileNamePrefix: string = '';
  }
  
export enum Location {
    VaultFolder,
    SameFolder,
    SpecifiedFolder
}