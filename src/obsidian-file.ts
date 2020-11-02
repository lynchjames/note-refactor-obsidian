import { App, MarkdownView, Notice, Vault } from 'obsidian';
import { NoteRefactorSettings, Location } from './settings';
import MomentDateRegex from './moment-date-regex'
import NRFile from './file';

export default class ObsidianFile {
    settings: NoteRefactorSettings;
    vault: Vault;
    view: MarkdownView;
    app: App;
    file: NRFile;
    momentDateRegex: MomentDateRegex;

    constructor(setting: NoteRefactorSettings, app: App) {
        this.settings = setting;
        this.app = app;
        this.vault = app.vault;
        this.file = new NRFile(this.settings);
        this.momentDateRegex = new MomentDateRegex();
    }

    filePath(view: any) : string {
        let path = '';
        switch(this.settings.newFileLocation){
          case Location.VaultFolder:
            path = this.vault.getRoot().path;
            break;
          case Location.SameFolder:
            path = this.view.file.parent.path;
            break;
          case Location.SpecifiedFolder:
            path = this.momentDateRegex.replace(this.settings.customFolder);
            break;
        }
        return this.file.normalizePath(path);
    }
  
    filePathAndFileName(fileName: string, view: any): string {
      return this.file.normalizePath(`${this.filePath(view)}/${fileName}.md`);
    }

    async createFile(fileName: string, note: string): Promise<boolean> {
      const view = this.app;
      const folderPath = this.filePath(view);
      const filePath = this.filePathAndFileName(fileName, view);
      console.log('File path in create file', filePath);
      const exists = await this.vault.adapter.exists(filePath, false);
        if(exists){
          new Notice(`A file named ${fileName} already exists`);
          return true;
        } else {
          //Check if folder exists and create if needed
          const folderExists = await this.vault.adapter.exists(folderPath, false);
            if(!folderExists) {
              const folders = folderPath.split('/');
              await this.createFoldersFromVaultRoot('', folders);
              await this.vault.create(filePath, note);      
            } else {
              //Otherwise save the file into the existing folder
              await this.vault.create(filePath, note);
            }
            return false;
        }
    }
  
    async createFoldersFromVaultRoot(parentPath: string, folders: string[]): Promise<void> {
      if(folders.length === 0) {
        return;
      }
      const newFolderPath = this.file.normalizePath([parentPath, folders[0]].join('/'));
      const folderExists = await this.vault.adapter.exists(newFolderPath, false)
        folders.shift();
        if(folderExists) {
          await this.createFoldersFromVaultRoot(newFolderPath, folders);
        } else {
          await this.vault.createFolder(newFolderPath);
          await this.createFoldersFromVaultRoot(newFolderPath, folders)
        }
    }
}