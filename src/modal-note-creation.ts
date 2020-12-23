import NRDoc, { ReplaceMode } from './doc';
import NRFile from './file';
import { App, getLinkpath, MarkdownView, TFile, View } from 'obsidian';
import { Editor } from 'codemirror';
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
    
    constructor(app: App, settings: NoteRefactorSettings, doc :NRDoc, file: NRFile, obsFile:ObsidianFile, content: string, editor: CodeMirror.Editor, mode: ReplaceMode) {
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
        const templatedContent = this.templatedContent(this.content, currentFile.basename, fileName);
        const filePath = await this.obsFile.createOrAppendFile(fileName, templatedContent)
        this.doc.replaceContent(fileName, this.editor, currentFile.name, templatedContent, this.content, this.mode);
        this.app.workspace.openLinkText(fileName, getLinkpath(filePath), true);
      }

      async append(file: TFile, existingContent?: string) {
        const { currentView, currentFile } = this.getCurrentFile();
        const templatedContent = this.templatedContent(this.content, currentFile.basename, file.basename);
        existingContent = existingContent ?? (await this.app.vault.read(file) + '\r\r');
        await this.app.vault.modify(file, existingContent + templatedContent);
        this.doc.replaceContent(file.basename, this.editor, currentFile.name, templatedContent, this.content, this.mode);
        this.app.workspace.openLinkText(file.basename, getLinkpath(file.path), true);
      }

      getCurrentFile(): {currentView: MarkdownView, currentFile: TFile} {
        const currentView = this.app.workspace.activeLeaf.view as MarkdownView;
        const currentFile = currentView.file
        return {currentView, currentFile};
      }

      private templatedContent(note: string, currentFileName: string, fileName: string) {
        if(this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
          return this.doc.templatedContent(note, this.settings.refactoredNoteTemplate, currentFileName, fileName, '', note);
        }
        return note;
      }
  }