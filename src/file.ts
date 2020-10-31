import { App, MarkdownView, Notice, Vault } from 'obsidian';
import { NoteRefactorSettings, Location } from './settings';
import MomentDateRegex from './moment-date-regex'

export default class NRFile {
    settings: NoteRefactorSettings;
    vault: Vault;
    momentDateRegex: MomentDateRegex;
    view: MarkdownView;
    app: App;

    constructor(setting: NoteRefactorSettings, app: App) {
        this.settings = setting;
        this.app = app;
        this.vault = app.vault;
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
        return this.normalizePath(path);
      }
    
      filePathAndFileName(fileName: string, view: any): string {
        return this.normalizePath(`${this.filePath(view)}/${this.sanitisedFileName(fileName)}.md`);
      }

      sanitisedFileName(unsanitisedFilename: string): string {
        const headerRegex = /[#*"\/\\<>:|]/gim;
        return unsanitisedFilename.replace(headerRegex, '').trim().slice(0, 255);
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

      async createFile(fileName: string, note: string): Promise<void> {
        const view = this.app;
        const folderPath = this.filePath(view);
        const filePath = this.filePathAndFileName(fileName, view);
        const exists = await this.vault.adapter.exists(filePath, false);
          if(exists){
            new Notice(`A file named ${fileName} already exists`);
            return;
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
          }
      }
    
      async createFoldersFromVaultRoot(parentPath: string, folders: string[]): Promise<void> {
        if(folders.length === 0) {
          return;
        }
        const newFolderPath = this.normalizePath([parentPath, folders[0]].join('/'));
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