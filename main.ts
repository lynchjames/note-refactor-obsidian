import {
  App,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  Modal
} from "obsidian";

export default class NoteRefactor extends Plugin {
  settings: NoteRefactorSettings;

  onInit() {}

  async onload() {
    console.log("Loading Note Refactor plugin");
    this.settings = (await this.loadData()) || new NoteRefactorSettings();

    this.addCommand({
      id: 'app:extract-selection-first-line',
      name: 'Extract selection to new note - first line as file name',
      callback: () => this.editModeGuard(() => this.extractSelectionFirstLine(false)),
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

  extractSelectionFirstLine(split:boolean): void {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      const doc = mdView.sourceMode.cmEditor;
      
      let selectedContent = split ? this.noteRemainder(doc) : this.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      const [header, ...contentArr] = selectedContent;

      let fileName = this.sanitisedFileName(header);
      //TODO: Use file path settings
      let filePath = fileName + '.md';
      this.app.vault.adapter.exists(filePath, false).then((exists) => {
        if(exists){
          new Notice(`A file named ${fileName} already exists`);
          return;
        } else {
          this.app.vault.create(filePath, this.noteContent(header, contentArr)).then((newFile) => {
            this.replaceContent(fileName, doc, split)
            this.app.workspace.openLinkText(fileName, filePath, true);
          });
        }
      });
  }

  extractSelectionContentOnly(split:boolean): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView) {return}
    const doc = mdView.sourceMode.cmEditor;
    
    let contentArr = split? this.noteRemainder(doc): this.selectedContent(doc);
    if(contentArr.length <= 0) { return }
    this.loadModal(contentArr, doc, split);
  }

  sanitisedFileName(unsanitisedFilename: string): string {
    const headerRegex = /[*"\/\\<>:|]/gim;
    return unsanitisedFilename.replace(headerRegex, '').trim().slice(0, 255);
  }

  selectedContent(doc:CodeMirror.Editor): string[] {
    let selectedText = doc.getSelection()
    return selectedText.split('\n')
  }

  noteRemainder(doc:CodeMirror.Editor): string[] {
    doc.setCursor(doc.getCursor().line, 0);
    let currentLine = doc.getCursor();
    let endPosition = doc.posFromIndex(doc.getValue().length);
    let content = doc.getRange(currentLine, endPosition);
    return content.split('\n');
  }

  removeNoteRemainder(doc:CodeMirror.Editor, text:string): void {
    let currentLine = doc.getCursor();
    let endPosition = doc.posFromIndex(doc.getValue().length);
    doc.replaceRange(text, currentLine, endPosition);
  }

  replaceContent(fileName:string, doc:CodeMirror.Editor, split?:boolean): void {
    let internalLink = `[[${fileName}]]`;
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
      let headingBaseline = firstLine.replace(headingRegex, '');
      //Adds formatted heading into content array as first item. 
      //Trimming allows for an empty heading format. 
      contentArr.unshift(`${this.settings.headingFormat} ${headingBaseline}`.trim());
    } else {
      //Adds first line back into content if it is not to be included as a header
      contentArr.unshift(firstLine);
    }
    return contentArr.join('\n').trim()
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
    let {contentEl} = this;
    let fileName = '';

    let setting = new Setting(contentEl)
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
              .onClick(() => {
                //Sanitising again just in case
                let filePath = this.plugin.sanitisedFileName(fileName) + '.md';
                  this.app.vault.adapter.exists(filePath, false).then((exists) => {
                    if(exists){
                      new Notice(`A file named ${fileName} already exists`);
                      return;
                    } else {
                      this.app.vault.create(filePath, this.content).then((newFile) => {
                        this.plugin.replaceContent(fileName, this.doc, this.split);
                        this.app.workspace.openLinkText(fileName, filePath, true);
                        this.close();
                      });
                    }
                  });
              }));
      setting.controlEl.focus();
    }

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class NoteRefactorSettings {
  includeFirstLineAsNoteHeading: boolean = false;
  headingFormat: string = '#';
}

class NoteRefactorSettingsTab extends PluginSettingTab {
  plugin: NoteRefactor;
  constructor(app: App, plugin: NoteRefactor) {
    super(app, plugin);
    this.plugin = plugin;
  }
  
  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Include Heading')
      .setDesc('Include first line of selection as note heading')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.includeFirstLineAsNoteHeading)
        .onChange((value) => {
          this.plugin.settings.includeFirstLineAsNoteHeading = value;
          this.plugin.saveData(this.plugin.settings);
          this.display();
        }));

    if(this.plugin.settings.includeFirstLineAsNoteHeading){
      new Setting(containerEl)
        .setName('Heading format')
        .setDesc('Set format of the heading to be included in note content')
        .addText((text) =>
            text
                .setPlaceholder("# or ##")
                .setValue(this.plugin.settings.headingFormat)
                .onChange((value) => {
                    this.plugin.settings.headingFormat = value;
                    this.plugin.saveData(this.plugin.settings);
        }));
      }
  }
}