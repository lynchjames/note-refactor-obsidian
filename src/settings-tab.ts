import {
    App,
    PluginSettingTab,
    Setting
} from 'obsidian';
import {Location } from './settings';
import MomentDateRegex from './moment-date-regex';
import NoteRefactor from './main';
  
  export class NoteRefactorSettingsTab extends PluginSettingTab {
    uPop = document.createElement('b');
    momentDateRegex = new MomentDateRegex();
    plugin: NoteRefactor;
    constructor(app: App, plugin: NoteRefactor) {
      super(app, plugin);
      this.plugin = plugin;
  }
  
    display(): void {
      const { containerEl } = this;
  
      containerEl.empty();
      this.uPop.className = 'u-pop';
  
      new Setting(containerEl)
        .setName('Default location for new notes')
        .setDesc('Where newly created notes are placed. Plugin settings will override this.')
        .addDropdown(dropDown => 
          dropDown
            .addOption(Location[Location.VaultFolder], "Vault folder")
            .addOption(Location[Location.SameFolder], "Same folder as current file")
            .addOption(Location[Location.SpecifiedFolder], "In the folder specified below")
            .setValue(Location[this.plugin.settings.newFileLocation] || Location.VaultFolder.toString())
            .onChange((value:string) => {
              this.plugin.settings.newFileLocation = Location[value as keyof typeof Location];
              this.plugin.saveData(this.plugin.settings);
              this.display();
            }));
  
      if(this.plugin.settings.newFileLocation == Location.SpecifiedFolder){
        new Setting(containerEl)
          .setName('Folder for new notes')
          .setDesc(this.descriptionContent())
          .addTextArea((text) =>
              text
                  .setPlaceholder("Example: folder 1/folder")
                  .setValue(this.plugin.settings.customFolder)
                  .onChange((value) => {
                      this.plugin.settings.customFolder = value;
                      this.plugin.saveData(this.plugin.settings);
                      this.uPop.innerText = this.momentDateRegex.replace(this.plugin.settings.customFolder);
          }));
      }

      new Setting(containerEl)
      .setName('Include First Line')
      .setDesc('Include first line of selection in note content')
      .addToggle(toggle => toggle.setValue(this.plugin.settings.includeFirstLineInNote)
        .onChange((value) => {
          this.plugin.settings.includeFirstLineInNote = value;
          this.plugin.saveData(this.plugin.settings);
          this.display();
        }));
  
      if(this.plugin.settings.includeFirstLineInNote) {
        new Setting(containerEl)
          .setName('Include Heading')
          .setDesc('Include first line of selection as note heading')
          .addToggle(toggle => toggle.setValue(this.plugin.settings.includeFirstLineAsNoteHeading)
            .onChange((value) => {
              this.plugin.settings.includeFirstLineAsNoteHeading = value;
              this.plugin.saveData(this.plugin.settings);
              this.display();
            }));
      }
  
      if(this.plugin.settings.includeFirstLineInNote && this.plugin.settings.includeFirstLineAsNoteHeading){
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
  
    descriptionContent(): DocumentFragment {
      const descEl = document.createDocumentFragment();
      descEl.appendText('Newly created notes will appear under this folder.');
      descEl.appendChild(document.createElement('br'));
      descEl.appendText('Date formats are supported {{date:YYYYMMDD}} and used with current date when note is created.');
      descEl.appendChild(document.createElement('br'));
      descEl.appendText('For more syntax, refer to ');
      const a = document.createElement('a');
      a.href = 'https://momentjs.com/docs/#/displaying/format/';
      a.text = 'format reference';
      a.target = '_blank';
      descEl.appendChild(a);
      descEl.appendChild(document.createElement('br'));
      descEl.appendText('Your current folder path syntax looks like this:');
      descEl.appendChild(document.createElement('br'));
      this.uPop.innerText = this.momentDateRegex.replace(this.plugin.settings.customFolder);
      descEl.appendChild(this.uPop);
      return descEl;
    }
  }