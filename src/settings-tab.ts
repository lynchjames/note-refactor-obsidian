import {
  App,
  PluginSettingTab,
  Setting
} from 'obsidian';
import { Location } from './settings';
import MomentDateRegex from './moment-date-regex';
import NoteRefactor from './main';

export class NoteRefactorSettingsTab extends PluginSettingTab {
  folderUPop = document.createElement('b');
  filePrefixUPop = document.createElement('b');
  momentDateRegex = new MomentDateRegex();
  plugin: NoteRefactor;
  constructor(app: App, plugin: NoteRefactor) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    this.folderUPop.className = this.filePrefixUPop.className = 'u-pop';

    new Setting(containerEl)
      .setName('Default location for new notes')
      .setDesc('Where newly created notes are placed.')
      .addDropdown(dropDown =>
        dropDown
          .addOption(Location[Location.VaultFolder], "Vault folder")
          .addOption(Location[Location.SameFolder], "Same folder as current file")
          .addOption(Location[Location.SpecifiedFolder], "In the folder specified below")
          .setValue(Location[this.plugin.settings.newFileLocation] || Location.VaultFolder.toString())
          .onChange((value: string) => {
            this.plugin.settings.newFileLocation = Location[value as keyof typeof Location];
            this.plugin.saveData(this.plugin.settings);
            this.display();
          }));

    if (this.plugin.settings.newFileLocation == Location.SpecifiedFolder) {
      new Setting(containerEl)
        .setName('Folder for new notes')
        .setDesc(this.folderDescriptionContent())
        .addTextArea((text) =>
          text
            .setPlaceholder("Example: folder 1/folder")
            .setValue(this.plugin.settings.customFolder)
            .onChange((value) => {
              this.plugin.settings.customFolder = value;
              this.plugin.saveData(this.plugin.settings);
              this.updateFolderUPop();
            }));
    }

    new Setting(containerEl)
      .setName('File name prefix')
      .setDesc(this.filenamePrefixDescriptionContent())
      .addTextArea((text) => {
        text
          .setPlaceholder("Example: {{date:YYYYMMDDHHmm}}-")
          .setValue(this.plugin.settings.fileNamePrefix || '')
          .onChange((value) => {
            this.plugin.settings.fileNamePrefix = value;
            this.plugin.saveData(this.plugin.settings);
            this.updateFileNamePrefixUPop();
          });
        text.inputEl.rows = 2;
        text.inputEl.cols = 25;
      });

    new Setting(containerEl)
      .setName('Transclude by default')
      .setDesc('When content has been extracted/split into a new note, include a transclusion of the new note')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.transcludeByDefault)
        .onChange((value) => {
          this.plugin.settings.transcludeByDefault = value;
          this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Note link template')
      .setDesc(this.tempalteDescriptionContent('The template used to generate the link to the extracted note. This overrides the Transclude by Default setting.'))
      .addTextArea((text) => {
        text
          .setPlaceholder("Example:\n\nSee also -> {{new_note_link}}")
          .setValue(this.plugin.settings.noteLinkTemplate || '')
          .onChange((value) => {
            this.plugin.settings.noteLinkTemplate = value;
            this.plugin.saveData(this.plugin.settings);
            return text;
          })
        text.inputEl.rows = 10;
        text.inputEl.cols = 25;
      });

    new Setting(containerEl)
      .setName('Refactored note template')
      .setDesc(this.tempalteDescriptionContent('The template used to generate the content for the refactored note.'))
      .addTextArea((text) => {
        text
          .setPlaceholder('Example:\n\n{{new_note_content}}\n\n---\nLink to original note: {{link}}')
          .setValue(this.plugin.settings.refactoredNoteTemplate || '')
          .onChange((value) => {
            this.plugin.settings.refactoredNoteTemplate = value;
            this.plugin.saveData(this.plugin.settings);
            return text;
          })
        text.inputEl.rows = 10;
        text.inputEl.cols = 25;
      });

    new Setting(containerEl)
      .setName('Exclude First Line')
      .setDesc('Prevent the first line of selected/split note content from being included in the new note (only applies for first line as file name commands)')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.excludeFirstLineInNote)
        .onChange((value) => {
          this.plugin.settings.excludeFirstLineInNote = value;
          this.plugin.saveData(this.plugin.settings);
          this.display();
        }));

    new Setting(containerEl)
      .setName('Include Heading')
      .setDesc('Include first line of selected/split note content as note heading (applies for both first line as title and content only commands)')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.includeFirstLineAsNoteHeading)
        .onChange((value) => {
          this.plugin.settings.includeFirstLineAsNoteHeading = value;
          this.plugin.saveData(this.plugin.settings);
          this.display();
        }));

    new Setting(containerEl)
      .setName('Open New Note')
      .setDesc('Open the new note in a new pane')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.openNewNote)
        .onChange((value) => {
          this.plugin.settings.openNewNote = value;
          this.plugin.saveData(this.plugin.settings);
        }));

    if (this.plugin.settings.includeFirstLineAsNoteHeading) {
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

    new Setting(containerEl)
      .setName('Normalize heading levels')
      .setDesc('When content has been extracted/split into a new note, normalize the levels of the headings')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.normalizeHeaderLevels)
        .onChange((value) => {
          this.plugin.settings.normalizeHeaderLevels = value;
          this.plugin.saveData(this.plugin.settings);
        }));
  }

  private tempalteDescriptionContent(introText: string): DocumentFragment {
    const descEl = document.createDocumentFragment();
    descEl.appendText(introText);
    descEl.appendChild(document.createElement('br'));
    descEl.appendText('Supported placeholders:');
    descEl.appendChild(document.createElement('br'));
    descEl.appendText('{{date}} {{title}} {{link}} {{new_note_title}} {{new_note_link}} {{new_note_content}}');
    return descEl;
  }

  private folderDescriptionContent(): DocumentFragment {
    const descEl = document.createDocumentFragment();
    descEl.appendText('Newly created notes will appear under this folder.');
    descEl.appendChild(document.createElement('br'));
    descEl.appendText('For more syntax, refer to ');
    this.dateFormattingDescription(descEl);
    descEl.appendText('Your current folder path syntax looks like this:');
    descEl.appendChild(document.createElement('br'));
    this.updateFolderUPop()
    descEl.appendChild(this.folderUPop);
    return descEl;
  }

  private updateFolderUPop() {
    this.folderUPop.innerText = this.momentDateRegex.replace(this.plugin.settings.customFolder);
  }

  private filenamePrefixDescriptionContent(): DocumentFragment {
    const descEl = document.createDocumentFragment();
    descEl.appendText('Newly created notes will have this prefix');
    descEl.appendChild(document.createElement('br'));
    this.dateFormattingDescription(descEl);
    descEl.appendText('Your current file name prefix syntax looks like this:');
    descEl.appendChild(document.createElement('br'));
    this.updateFileNamePrefixUPop();
    descEl.appendChild(this.filePrefixUPop);
    return descEl;
  }

  private dateFormattingDescription(descEl: DocumentFragment) {
    descEl.appendText('Date formats are supported {{date:YYYYMMDDHHmm}}');
    descEl.appendChild(document.createElement('br'));
    descEl.appendText('and used with current date and time when note is created.');
    descEl.appendChild(document.createElement('br'));
    descEl.appendText('For more syntax, refer to ');
    this.addMomentDocsLink(descEl);
  }

  private updateFileNamePrefixUPop() {
    this.filePrefixUPop.innerText = this.momentDateRegex.replace(this.plugin.settings.fileNamePrefix);
  }

  private addMomentDocsLink(descEl: DocumentFragment) {
    const a = document.createElement('a');
    a.href = 'https://momentjs.com/docs/#/displaying/format/';
    a.text = 'format reference';
    a.target = '_blank';
    descEl.appendChild(a);
    descEl.appendChild(document.createElement('br'));
  }
}