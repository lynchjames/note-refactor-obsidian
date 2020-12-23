import { App, Notice, Vault, normalizePath, TFile } from 'obsidian';
import { NoteRefactorSettings, Location } from './settings';
import MomentDateRegex from './moment-date-regex'
import NRFile from './file';

export default class ObsidianFile {
    private settings: NoteRefactorSettings;
    private vault: Vault;
    private app: App;
    private file: NRFile;
    private momentDateRegex: MomentDateRegex;

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
            path = view.file.parent.path;
            break;
          case Location.SpecifiedFolder:
            path = this.momentDateRegex.replace(this.settings.customFolder);
            break;
        }
        return normalizePath(path);
    }
  
    filePathAndFileName(fileName: string, view: any): string {
      return normalizePath(`${this.filePath(view)}/${fileName}.md`);
    }

    async createOrAppendFile(fileName: string, note: string) {
      const view = this.app.workspace.activeLeaf.view;
      const folderPath = this.filePath(view);
      const filePath = this.filePathAndFileName(fileName, view);
      //Check if folder exists and create if needed
      const folderExists = await this.vault.adapter.exists(folderPath, false);
      if(!folderExists) {
        const folders = folderPath.split('/');
        try {
          await this.createFoldersFromVaultRoot('', folders);
        } catch (error) {
          console.error(error)
        }
      }
      try {
        //If files exists then append conent to existing file
        const fileExists = await this.vault.adapter.exists(filePath);
        if(fileExists){
          await this.appendFile(filePath, note);
        } else {
          await this.vault.create(filePath, note);
        }
        return filePath;
      } catch (error) {
        console.error(error);
      }
    }

    async appendFile(filePath: string, note: string) {
      let existingContent = await this.app.vault.adapter.read(filePath);
      if(existingContent.length > 0) {
        existingContent = existingContent + '\r\r';
      }
      await this.vault.adapter.write(filePath, existingContent + note);
    }
  
    private async createFoldersFromVaultRoot(parentPath: string, folders: string[]): Promise<void> {
      if(folders.length === 0) {
        return;
      }
      const newFolderPath = normalizePath([parentPath, folders[0]].join('/'));
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