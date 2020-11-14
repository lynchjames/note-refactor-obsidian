import NRDoc, { ReplaceMode } from './doc';
import NRFile from './file';
import { App, MarkdownView, Modal, Setting } from 'obsidian';
import { Editor } from 'codemirror';
import ObsidianFile from './obsidian-file';
import { NoteRefactorSettings } from './settings';

export default class FileNameModal extends Modal {
    settings: NoteRefactorSettings;
    content: string;
    doc: NRDoc;
    obsFile: ObsidianFile;
    file: NRFile
    editor: Editor;
    mode: ReplaceMode;
    fileNameInput: HTMLInputElement;
    
    constructor(app: App, settings: NoteRefactorSettings, doc :NRDoc, file: NRFile, obsFile:ObsidianFile, content: string, editor: CodeMirror.Editor, mode: ReplaceMode) {
      super(app);
      this.settings = settings;
      this.content = content;
      this.doc = doc;
      this.obsFile = obsFile;
      this.file = file;
      this.editor = editor;
      this.mode = mode;
    }

      onOpen() {
      const {contentEl} = this;
      let fileName = '';

      const heading = document.createElement('h1');
      heading.innerText = 'Create note';
      contentEl.appendChild(heading)
      const setting = new Setting(contentEl)
          .setName(this.file.fileNamePrefix())
          .setClass('note-refactor-filename')
          .addText((text) =>
              text
                .setPlaceholder('Note name')
                .onChange((value) => {
                  fileName = value;
                }))
          .addButton((button) => 
              button
                .setButtonText('Create')
                .setCta()
                .onClick(async () => {
                  await this.submitModal(this.file.sanitisedFileName(fileName));
                }));
        this.fileNameInput = setting.controlEl.children[0] as HTMLInputElement;
        this.fileNameInput.addEventListener('keypress', (e) => this.handleKeyUp(this.fileNameInput, e));
        this.fileNameInput.focus();
      }

      private async handleKeyUp(input: HTMLInputElement, event: KeyboardEvent) {
        if(event.key === 'Enter'){
          const fileName = this.file.sanitisedFileName(input.value);
          this.submitModal(fileName);
        }
      }
    
      private async submitModal(fileName: string) : Promise<void> {
        const exists = await this.obsFile.createFile(fileName, this.content)
        if(!exists) {
          const currentView = this.app.workspace.activeLeaf.view as MarkdownView;
          const currentFile = currentView.file;
          const templatedContent = this.templatedContent(this.content, currentFile.basename, fileName);

          this.doc.replaceContent(fileName, this.editor, currentFile.name, templatedContent, this.content, this.mode);
          this.app.workspace.openLinkText(fileName, this.obsFile.filePath(currentView), true);
          this.close();
        }
      }

      private templatedContent(note: string, currentFileName: string, fileName: string) {
        if(this.settings.refactoredNoteTemplate !== undefined && this.settings.refactoredNoteTemplate !== '') {
          return this.doc.templatedContent(note, this.settings.refactoredNoteTemplate, currentFileName, fileName, note);
        }
        return note;
      }
  
      onClose() {
          const {contentEl} = this;
          contentEl.empty();
      }
  }