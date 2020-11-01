export class NoteRefactorSettings {
    includeFirstLineAsNoteHeading: boolean = false;
    excludeFirstLineInNote: boolean = false;
    headingFormat: string = '#';
    newFileLocation: Location = Location.VaultFolder;
    customFolder: string = '';
  }
  
export enum Location {
    VaultFolder,
    SameFolder,
    SpecifiedFolder
}