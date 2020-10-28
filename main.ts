import {
  App,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

export default class NoteRefactor extends Plugin {
  settings: NoteRefactorSettings;

  onInit() {}

  async onload() {
    console.log("Loading Note Refactor plugin");
    this.settings = (await this.loadData()) || new NoteRefactorSettings();

    this.addCommand({
      id: 'app:extract-selection',
      name: 'Extract selection to new note',
      callback: () => this.extractSelection(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "n",
        },
      ],
    });

    this.addSettingTab(new NoteRefactorSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Unloading Note Refactor plugin");
  }

  extractSelection(): void {
      const markdownSourceView = this.app.workspace.activeLeaf.getViewState();
      const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
      if(!mdView) {return}
      const doc = mdView.sourceMode.cmEditor;
      const selectedText = doc.getSelection()

      if (!selectedText) { return }

      const [header, ...contentArr] = selectedText.split('\n')

      const rootFolder = this.app.vault.getRoot();

      let headerRegex = /[^\w\s_-]+/gim;

      //TODO: Use file path settings
      let fileName = header.replace(headerRegex, '').trim();
      let filePath = fileName + '.md';
      this.app.vault.adapter.exists(filePath, false).then((exists) => {
        if(exists){
          console.log('File exists!')
          new Notice(`A file namde ${fileName} already exists`);
          return;
        } else {
          this.app.vault.create(filePath, contentArr.join('\n').trim()).then((newFile) => {
            doc.replaceSelection(`[[${fileName}]]`);
            this.app.workspace.openLinkText(fileName, filePath, true);
          });
        }
      });
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
    let headerFormatSetting: Setting;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Include Heading')
      .setDesc('Include first line of selection as note heading')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.includeFirstLineAsNoteHeading)
        .onChange((value) => {
          this.plugin.settings.includeFirstLineAsNoteHeading = value;
          this.plugin.saveData(this.plugin.settings);
          console.log('Include heading setting: ', this.plugin.settings)
            this.display();
        }));

    if(this.plugin.settings.includeFirstLineAsNoteHeading){
      new Setting(containerEl)
        .setName('Heading format')
        .setDesc('Set format of the heading to be included in note content')
        .addText((text) =>
            text
                .setPlaceholder("# or ##")
                .setValue(this.plugin.settings.headingFormat || '#')
                .onChange((value) => {
                    this.plugin.settings.headingFormat = value;
                    this.plugin.saveData(this.plugin.settings);
        }));
      }
  }
}