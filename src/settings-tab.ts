import {
    App,
    PluginSettingTab,
    Setting
} from 'obsidian';
import {Location } from './settings';
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
      .addTextArea((text) =>
          text
              .setPlaceholder("Example: {{date:YYYYMMDDHHmm}}-")
              .setValue(this.plugin.settings.fileNamePrefix || '')
              .onChange((value) => {
                  this.plugin.settings.fileNamePrefix = value;
                  this.plugin.saveData(this.plugin.settings);
                  this.updateFileNamePrefixUPop();
      }));

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