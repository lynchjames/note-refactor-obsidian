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
      callback: () => this.extractSelectionFirstLine(),
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
      callback: () => this.extractSelectionContentOnly(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "c",
        },
      ],
    });

    this.addSettingTab(new NoteRefactorSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Unloading Note Refactor plugin");
  }

  extractSelectionFirstLine(): void {
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      if(!mdView) {return}
      const doc = mdView.sourceMode.cmEditor;
      
      let selectedContent = this.selectedContent(doc);
      if(selectedContent.length <= 0) { return }

      const [header, ...contentArr] = selectedContent;

      let fileName = this.sanitisedFileName(header);
      //TODO: Use file path settings
      let filePath = fileName + '.md';
      this.app.vault.adapter.exists(filePath, false).then((exists) => {
        if(exists){
          new Notice(`A file namde ${fileName} already exists`);
          return;
        } else {
          this.app.vault.create(filePath, this.noteContent(fileName, contentArr)).then((newFile) => {
            doc.replaceSelection(`[[${fileName}]]`);
            this.app.workspace.openLinkText(fileName, filePath, true);
          });
        }
      });
  }

  extractSelectionContentOnly(): void {
    const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
    if(!mdView) {return}
    const doc = mdView.sourceMode.cmEditor;
    
    let contentArr = this.selectedContent(doc);
    if(contentArr.length <= 0) { return }
    this.loadModal(this.sanitisedFileName(contentArr[0]), contentArr, doc);
  }

  sanitisedFileName(unsanitisedFilename: string): string {
    const headerRegex = /[^\w\s_-]+/gim;
    return unsanitisedFilename.replace(headerRegex, '').trim();
  }

  selectedContent(doc:CodeMirror.Editor): string[] {
    let selectedText = doc.getSelection()
    return selectedText.split('\n')
  }

  loadModal(fileName: string, contentArr:string[], doc:CodeMirror.Editor): void {
    new FileNameModal(this.app, this.noteContent(fileName, contentArr.slice(1)), doc).open();
  }

  noteContent(fileName:string, contentArr:string[]): string {
    if(this.settings.includeFirstLineAsNoteHeading){
      //Adds formatted heading into content array as first item. 
      //Trimming allows for an empty heading format. 
      contentArr.unshift(`${this.settings.headingFormat} ${fileName}`.trim())
    }
    return contentArr.join('\n').trim()
  }
}

class FileNameModal extends Modal {
  content: string;
  doc: CodeMirror.Editor;
	constructor(app: App, content: string, doc: CodeMirror.Editor) {
    super(app);
    this.content = content;
    this.doc = doc;
  }

	onOpen() {
    let {contentEl} = this;
    let fileName = '';

    new Setting(contentEl)
        .setName('File name')
        .setDesc('Enter the name of the new note')
        .addText((text) =>
            text
              .onChange((value) => {
                fileName = value;
              }))
        .addButton((button) => 
            button
              .setButtonText('Create Note')
              .setCta()
              .onClick(() => {
                let filePath = fileName + '.md';
                  this.app.vault.adapter.exists(filePath, false).then((exists) => {
                    if(exists){
                      new Notice(`A file namde ${fileName} already exists`);
                      return;
                    } else {
                      this.app.vault.create(filePath, this.content).then((newFile) => {
                        this.doc.replaceSelection(`[[${fileName}]]`);
                        this.app.workspace.openLinkText(fileName, filePath, true);
                        this.close();
                      });
                    }
                  });
              }));
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