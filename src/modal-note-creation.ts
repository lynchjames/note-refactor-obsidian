import NRDoc, { ReplaceMode } from './doc';
import NRFile from './file';
import { App, Editor, getLinkpath, MarkdownView, TFile } from 'obsidian';
import ObsidianFile from './obsidian-file';
import { NoteRefactorSettings } from './settings';

export default class ModalNoteCreation {
    app: App;
    settings: NoteRefactorSettings;
    content: string;
    doc: NRDoc;
    obsFile: ObsidianFile;
    file: NRFile
    editor: Editor;
    mode: ReplaceMode;
    fileNameInput: HTMLInputElement;
    
    constructor(app: App, settings: NoteRefactorSettings, doc :NRDoc, file: NRFile, obsFile:ObsidianFile, content: string, editor: Editor, mode: ReplaceMode) {
      this.app = app;
      this.settings = settings;
      this.content = content;
      this.doc = doc;
      this.obsFile = obsFile;
      this.file = file;
      this.editor = editor;
      this.mode = mode;
    }
    
      async create(fileName: string) : Promise<void> {
        fileName = this.file.sanitisedFileName(fileName);
        const { currentFile } = this.getCurrentFile();
        const filePath = await this.obsFile.createOrAppendFile(fileName, '');
        const templatedContent = await this.templatedContent(this.content, currentFile, filePath, fileName);
        await this.obsFile.createOrAppendFile(fileName, templatedContent)
        await this.doc.replaceContent(fileName, filePath, this.editor, currentFile, templatedContent, this.content, fileName, this.mode);
        if(this.settings.openNewNote){
          this.app.workspace.openLinkText(fileName, getLinkpath(filePath), true);
        }
      }

      async append(file: TFile, existingContent?: string) {
        const { currentView, currentFile } = this.getCurrentFile();
        const templatedContent = await this.templatedContent(this.content, currentFile, file.path, file.basename);
        existingContent = existingContent ?? (await this.app.vault.read(file) + '\r\r');
        await this.app.vault.modify(file, existingContent + templatedContent);
        await this.doc.replaceContent(file.basename, file.path, this.editor, currentFile, templatedContent, this.content, file.basename, this.mode);
        if(this.settings.openNewNote){
          this.app.workspace.openLinkText(file.basename, getLinkpath(file.path), true);
        }
      }

      getCurrentFile(): {currentView: MarkdownView, currentFile: TFile} {
        const currentView = this.app.workspace.activeLeaf.view as MarkdownView;
        const currentFile = currentView.file;
        return {currentView, currentFile};
      }

      private async templatedContent(note: string, curerntFile: TFile, filePath: string, fileName: string) {
        if(this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
          const currentFileLink = await this.doc.markdownLink(curerntFile.path);
          const fileLink = await this.doc.markdownLink(filePath);
          return this.doc.templatedContent(note, this.settings.refactoredNoteTemplate, curerntFile.basename, currentFileLink, fileName, fileLink, '', note, fileName);
        }
        return note;
      }
  }