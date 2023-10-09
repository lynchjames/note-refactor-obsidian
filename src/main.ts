import {
  MarkdownView,
  Plugin,
  Vault, 
  DataAdapter,
  SuggestModal,
  getLinkpath,
  Editor
} from 'obsidian';
import MomentDateRegex from './moment-date-regex';
import { NoteRefactorSettingsTab } from './settings-tab';
import { NoteRefactorSettings } from './settings';
import NRFile from './file';
import ObsidianFile from './obsidian-file';
import NRDoc, { ReplaceMode } from './doc';
import NoteRefactorModal from './note-modal';
import ModalNoteCreation from './modal-note-creation';

export default class NoteRefactor extends Plugin {
  settings: NoteRefactorSettings;
  momentDateRegex: MomentDateRegex;
  obsFile: ObsidianFile;
  file: NRFile;
  NRDoc: NRDoc;
  vault: Vault;
  vaultAdapter: DataAdapter;

  onInit() {}

  async onload() {
    console.log("Loading Note Refactor plugin");
    this.settings = Object.assign(new NoteRefactorSettings(), await this.loadData());
    this.momentDateRegex = new MomentDateRegex();
    this.obsFile = new ObsidianFile(this.settings, this.app)
    this.file = new NRFile(this.settings);
    this.NRDoc = new NRDoc(this.settings, this.app.vault, this.app.fileManager);
    
    this.addCommand({
      id: 'app:extract-selection-first-line',
      name: 'Extract selection to new note - first line as file name',
      callback: () => this.editModeGuard(async () => await this.extractSelectionFirstLine('replace-selection')),
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
      callback: () => this.editModeGuard(() => this.extractSelectionContentOnly('replace-selection')),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "c",
        },
      ],
    });

    this.addCommand({
      id: 'app:extract-selection-autogenerate-name',
      name: 'Extract selection to new note - only prefix as file name',
      callback: () => this.editModeGuard(() => this.extractSelectionAutogenerate('replace-selection'))
    });

    this.addCommand({
      id: 'app:split-note-first-line',
      name: 'Split note here - first line as file name',
      callback: () => this.editModeGuard(() => this.extractSelectionFirstLine('split')),
    });

    this.addCommand({
      id: 'app:split-note-content-only',
      name: 'Split note here - content only',
      callback: () => this.editModeGuard(() => this.extractSelectionContentOnly('split')),
    });

    this.addCommand({
      id: 'app:split-note-by-heading-h1',
      name: 'Split note by headings - H1',
      callback: () => this.editModeGuard(() => this.splitOnHeading(1)),
    });

    this.addCommand({
      id: 'app:split-note-by-heading-h2',
      name: 'Split note by headings - H2',
      callback: () => this.editModeGuard(() => this.splitOnHeading(2)),
    });

    this.addCommand({
      id: 'app:split-note-by-heading-h3',
      name: 'Split note by headings - H3',
      callback: () => this.editModeGuard(() => this.splitOnHeading(3)),
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

  async splitOnHeading(headingLevel: number){
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.editor;
      const headingNotes = this.NRDoc.contentSplitByHeading(doc, headingLevel);
      const dedupedFileNames = this.file.ensureUniqueFileNames(headingNotes);
      headingNotes.forEach((hn, i) => this.createNoteWithFirstLineAsFileName(dedupedFileNames[i], hn, mdView, doc, 'replace-headings', true));
  }

  async extractSelectionFirstLine(mode: ReplaceMode): Promise<void> {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.editor;
      if(!mdView) {return}
      
      const selectedContent = mode === 'split' ? this.NRDoc.noteRemainder(doc) : this.NRDoc.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      await this.createNoteWithFirstLineAsFileName(selectedContent[0], selectedContent, mdView, doc, mode, false);
  }

  async extractSelectionAutogenerate(mode: ReplaceMode): Promise<void> {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.editor;
      if(!mdView) {return}
      
      const selectedContent = mode === 'split' ? this.NRDoc.noteRemainder(doc) : this.NRDoc.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      await this.createAutogeneratedNote(selectedContent, mdView, doc, mode, true); // Don't open a new note in a new pane. TODO: perhaps a setting would be useful?
  }

  private async createAutogeneratedNote(selectedContent: string[], mdView: MarkdownView, doc: Editor, mode: ReplaceMode, isMultiple: boolean) {
    const [header, ...contentArr] = selectedContent;

    const fileName = this.file.fileNamePrefix(); // Only prefix is used for the note file name
    const originalNote = this.NRDoc.noteContent(header, contentArr);
    const newTitle = this.file.getNewTitle(header);
    let note = originalNote;
    const filePath = await this.obsFile.createOrAppendFile(fileName, '');

    if (this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
      const link = await this.app.fileManager.generateMarkdownLink(mdView.file, '', '', '');
      const newNoteLink = await this.NRDoc.markdownLink(filePath);
      note = this.NRDoc.templatedContent(note, this.settings.refactoredNoteTemplate, mdView.file.basename, link, fileName, newNoteLink, '', note, newTitle);
    }

    await this.obsFile.createOrAppendFile(fileName, note);
    await this.NRDoc.replaceContent(fileName, filePath, doc, mdView.file, note, originalNote, newTitle, mode);
    if(!isMultiple) {
        await this.app.workspace.openLinkText(fileName, getLinkpath(filePath), true);
    }
  }

  private async createNoteWithFirstLineAsFileName(dedupedHeader: string, selectedContent: string[], mdView: MarkdownView, doc: Editor, mode: ReplaceMode, isMultiple: boolean) {
    const [originalHeader, ...contentArr] = selectedContent;

    const fileName = this.file.sanitisedFileName(dedupedHeader);
    const newTitle = this.file.getNewTitle(dedupedHeader);
    const originalNote = this.NRDoc.noteContent(originalHeader, contentArr);
    let note = originalNote;
    const filePath = await this.obsFile.createOrAppendFile(fileName, '');

    if (this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
      const link = await this.app.fileManager.generateMarkdownLink(mdView.file, '', '', '');
      const newNoteLink = await this.NRDoc.markdownLink(filePath);
      note = this.NRDoc.templatedContent(note, this.settings.refactoredNoteTemplate, mdView.file.basename, link, fileName, newNoteLink, '', note, newTitle);
    }
    await this.obsFile.createOrAppendFile(fileName, note);
    await this.NRDoc.replaceContent(fileName, filePath, doc, mdView.file, note, originalNote, newTitle, mode);
    if(!isMultiple && this.settings.openNewNote) {
        await this.app.workspace.openLinkText(fileName, getLinkpath(filePath), true);
    }
  }

  extractSelectionContentOnly(mode:ReplaceMode): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView) {return}
    const doc = mdView.editor;
    
    const contentArr = mode === 'split' ? this.NRDoc.noteRemainder(doc): this.NRDoc.selectedContent(doc);
    if(contentArr.length <= 0) { return }
    this.loadModal(contentArr, doc, mode);
  }
  
  loadModal(contentArr:string[], doc:Editor, mode:ReplaceMode): void {
    let note = this.NRDoc.noteContent(contentArr[0], contentArr.slice(1), true);
    const modalCreation = new ModalNoteCreation(this.app, this.settings, this.NRDoc, this.file, this.obsFile, note, doc, mode);
    new NoteRefactorModal(this.app, modalCreation).open();
  }
}