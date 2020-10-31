import {
  MarkdownView,
  Plugin,
  Vault, 
  DataAdapter
} from 'obsidian';
import MomentDateRegex from './moment-date-regex';
import { NoteRefactorSettings, NoteRefactorSettingsTab } from './settings';
import NRFile from './file';
import NRDoc from './doc';
import FileNameModal from './modal';

export default class NoteRefactor extends Plugin {
  settings: NoteRefactorSettings;
  momentDateRegex: MomentDateRegex;
  NRfile: NRFile;
  NRDoc: NRDoc;
  vault: Vault;
  vaultAdapter: DataAdapter;

  onInit() {}

  async onload() {
    console.log("Loading Note Refactor plugin");
    this.settings = (await this.loadData()) || new NoteRefactorSettings();
    this.momentDateRegex = new MomentDateRegex();
    this.NRfile = new NRFile(this.settings, this.app)
    this.NRDoc = new NRDoc(this.settings);
    
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
      
      const selectedContent = split ? this.NRDoc.noteRemainder(doc) : this.NRDoc.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      const [header, ...contentArr] = selectedContent;

      const fileName = this.NRfile.sanitisedFileName(header);
      const note = this.NRDoc.noteContent(header, contentArr);
      await this.NRfile.createFile(fileName, note);
      this.NRDoc.replaceContent(fileName, doc, split)
      await this.app.workspace.openLinkText(fileName, this.NRfile.filePath(this.app.workspace.activeLeaf.view), true);
  }

  extractSelectionContentOnly(split:boolean): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView) {return}
    const doc = mdView.sourceMode.cmEditor;
    
    const contentArr = split? this.NRDoc.noteRemainder(doc): this.NRDoc.selectedContent(doc);
    if(contentArr.length <= 0) { return }
    this.loadModal(contentArr, doc, split);
  }
  
  loadModal(contentArr:string[], doc:CodeMirror.Editor, split:boolean): void {
    new FileNameModal(this.app, this.NRDoc, this.NRfile, this.NRDoc.noteContent(contentArr[0], contentArr.slice(1)), doc, split).open();
  }
}