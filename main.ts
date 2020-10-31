import {
  MarkdownView,
  Notice,
  Plugin,
  Setting,
  Modal, Vault, DataAdapter
} from 'obsidian';
import MomentDateRegex from 'moment-date-regex';
import { NoteRefactorSettings, NoteRefactorSettingsTab, Location } from 'settings';

export default class NoteRefactor extends Plugin {
  settings: NoteRefactorSettings;
  momentDateRegex: MomentDateRegex;
  vault: Vault;
  vaultAdapter: DataAdapter;

  onInit() {}

  async onload() {
    console.log("Loading Note Refactor plugin");
    this.settings = (await this.loadData()) || new NoteRefactorSettings();
    this.momentDateRegex = new MomentDateRegex();
    this.vault = this.app.vault;
    this.vaultAdapter = this.app.vault.adapter;
    
    this.addCommand({
      id: 'app:extract-selection-first-line',
      name: 'Extract selection to new note - first line as file name',
      callback: () => this.editModeGuard(async () => await this.extractSelectionFirstLine(false)),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "n",
        },
      ],
    });

    this.addCommand({
      id: 'app:extract-selection-content-only',
      name: 'Extract selection to new note - content only',
      callback: () => this.editModeGuard(() => this.extractSelectionContentOnly(false)),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "c",
        },
      ],
    });

    this.addCommand({
      id: 'app:split-note-first-line',
      name: 'Split note here - first line as file name',
      callback: () => this.editModeGuard(() => this.extractSelectionFirstLine(true)),
      hotkeys: [],
    });

    this.addCommand({
      id: 'app:split-note-content-only',
      name: 'Split note here - content only',
      callback: () => this.editModeGuard(() => this.extractSelectionContentOnly(true)),
      hotkeys: [],
    });

    this.addSettingTab(new NoteRefactorSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Unloading Note Refactor plugin");
  }

  editModeGuard(command: () => any): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView || mdView.getMode() !== 'source') {
      new Notification('Please use Note Refactor plugin in edit mode');
      return;
    } else {
      command();
    }
  }

  async extractSelectionFirstLine(split:boolean): Promise<void> {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.sourceMode.cmEditor;
      
      const selectedContent = split ? this.noteRemainder(doc) : this.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      const [header, ...contentArr] = selectedContent;

      const fileName = this.sanitisedFileName(header);
      const note = this.noteContent(header, contentArr);
      await this.createFile(fileName, note).then(async () => {
        this.replaceContent(fileName, doc, split)
        await this.app.workspace.openLinkText(fileName, this.filePath(), true);
      });
  }

  extractSelectionContentOnly(split:boolean): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView) {return}
    const doc = mdView.sourceMode.cmEditor;
    
    const contentArr = split? this.noteRemainder(doc): this.selectedContent(doc);
    if(contentArr.length <= 0) { return }
    this.loadModal(contentArr, doc, split);
  }

  sanitisedFileName(unsanitisedFilename: string): string {
    const headerRegex = /[*"\/\\<>:|]/gim;
    return unsanitisedFilename.replace(headerRegex, '').trim().slice(0, 255);
  }

  selectedContent(doc:CodeMirror.Editor): string[] {
    const selectedText = doc.getSelection()
    const trimmedContent = selectedText.trim();
    return trimmedContent.split('\n')
  }

  noteRemainder(doc:CodeMirror.Editor): string[] {
    doc.setCursor(doc.getCursor().line, 0);
    const currentLine = doc.getCursor();
    const endPosition = doc.posFromIndex(doc.getValue().length);
    const content = doc.getRange(currentLine, endPosition);
    const trimmedContent = content.trim();
    return trimmedContent.split('\n');
  }

  removeNoteRemainder(doc:CodeMirror.Editor, text:string): void {
    const currentLine = doc.getCursor();
    const endPosition = doc.posFromIndex(doc.getValue().length);
    doc.replaceRange(text, currentLine, endPosition);
  }

  replaceContent(fileName:string, doc:CodeMirror.Editor, split?:boolean): void {
    const internalLink = `[[${fileName}]]`;
    if(split){ 
      this.removeNoteRemainder(doc, internalLink);
    } else {
      doc.replaceSelection(internalLink);
    }

  }

  loadModal(contentArr:string[], doc:CodeMirror.Editor, split:boolean): void {
    new FileNameModal(this, this.noteContent(contentArr[0], contentArr.slice(1)), doc, split).open();
  }

  noteContent(firstLine:string, contentArr:string[]): string {
    if(this.settings.includeFirstLineAsNoteHeading){
      //Replaces any non-word characters whitespace leading the first line to enforce consistent heading format from setting
      const headingRegex = /^[#\s-]*/;
      const headingBaseline = firstLine.replace(headingRegex, '');
      //Adds formatted heading into content array as first item. 
      //Trimming allows for an empty heading format. 
      contentArr.unshift(`${this.settings.headingFormat} ${headingBaseline}`.trim());
    } else {
      //Adds first line back into content if it is not to be included as a header
      contentArr.unshift(firstLine);
    }
    return contentArr.join('\n').trim()
  }

  async createFile(fileName: string, note: string): Promise<void> {
    const folderPath = this.filePath();
    const filePath = this.filePathAndFileName(fileName);
    await this.vaultAdapter.exists(filePath, false).then(async exists => {
      if(exists){
        new Notice(`A file named ${fileName} already exists`);
        return;
      } else {
        //Check if folder exists and create if needed
        await this.vaultAdapter.exists(folderPath, false).then(async folderExists => {
          if(!folderExists) {
            const folders = folderPath.split('/');
            await this.createFoldersFromVaultRoot('', folders).then(async () => {
              await this.vault.create(filePath, note);      
            })
          } else {
            //Otherwise save the file into the existing folder
            await this.vault.create(filePath, note);
          }
        });
      }
    });
  }

  async createFoldersFromVaultRoot(parentPath: string, folders: string[]): Promise<void> {
    if(folders.length === 0) {
      return;
    }
    const newFolderPath = this.normalizePath([parentPath, folders[0]].join('/'));
    await this.vaultAdapter.exists(newFolderPath, false).then(async folderExists => {
      folders.shift();
      if(folderExists) {
        await this.createFoldersFromVaultRoot(newFolderPath, folders);
      } else {
        await this.vault.createFolder(newFolderPath).then(async newFolder => {
          await this.createFoldersFromVaultRoot(newFolderPath, folders)
        });
      }
    });
  }

  filePath() : string {
    let path = '';
    switch(this.settings.newFileLocation){
      case Location.VaultFolder:
        path = this.vault.getRoot().path;
        break;
      case Location.SameFolder:
        const view = this.app.workspace.activeLeaf.view as MarkdownView;
        path = view.file.parent.path;
        break;
      case Location.SpecifiedFolder:
        path = this.momentDateRegex.replace(this.settings.customFolder);
        break;
    }
    return this.normalizePath(path);
  }

  filePathAndFileName(fileName: string): string {
    return this.normalizePath(`${this.filePath()}/${this.sanitisedFileName(fileName)}.md`);
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

class FileNameModal extends Modal {
  plugin: NoteRefactor;
  content: string;
  doc: CodeMirror.Editor;
  split: boolean;
	constructor(plugin: NoteRefactor, content: string, doc: CodeMirror.Editor, split: boolean) {
    super(plugin.app);
    this.plugin = plugin;
    this.content = content;
    this.doc = doc;
    this.split = split;
  }

	onOpen() {
    const {contentEl} = this;
    let fileName = '';

    const setting = new Setting(contentEl)
        .setName('New note name')
        .addText((text) =>
            text
              .setPlaceholder('Note name')
              .onChange((value) => {
                fileName = value;
              }))
        .addButton((button) => 
            button
              .setButtonText('Create Note')
              .setCta()
              .onClick(async () => {
                await this.plugin.createFile(fileName, this.content).then(() => {
                  this.plugin.replaceContent(fileName, this.doc, this.split);
                  this.app.workspace.openLinkText(fileName, this.plugin.filePath(), true);
                  this.close();
                });
              }));
      setting.controlEl.getElementsByTagName('input')[0].focus();
    }

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
  }
}