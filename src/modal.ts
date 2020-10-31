import NRDoc from './doc';
import NRFile from './file';
import { App, Modal, Setting } from 'obsidian';
import { Editor } from 'codemirror';

export default class FileNameModal extends Modal {
    content: string;
    doc: NRDoc;
    file: NRFile;
    editor: Editor;
    split: boolean;
      constructor(app: App, doc :NRDoc, file:NRFile, content: string, editor: CodeMirror.Editor, split: boolean) {
      super(app);
      this.content = content;
      this.doc = doc;
      this.file = file;
      this.editor = editor;
      this.split = split;
    }
  
      onOpen() {
      const {contentEl} = this;
      let fileName = '';

      const heading = document.createElement('h1');
      heading.innerText = 'Create note';
      contentEl.appendChild(heading)
      const setting = new Setting(contentEl)
          .setName('')
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
                  const exists = await this.file.createFile(fileName, this.content)
                  if(!exists) {
                    this.doc.replaceContent(fileName, this.editor, this.split);
                    this.app.workspace.openLinkText(fileName, this.file.filePath(this.app.workspace.activeLeaf.view), true);
                    this.close();
                  }
                }));
        setting.controlEl.getElementsByTagName('input')[0].focus();
      }
  
      onClose() {
          const {contentEl} = this;
          contentEl.empty();
    }
  }