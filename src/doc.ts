import { Editor, FileManager, TFile, Vault } from 'obsidian';
import { HEADING_REGEX } from './constants';
import MomentDateRegex from './moment-date-regex';
import { NotePlaceholders } from './placeholder';
import { NoteRefactorSettings } from './settings';
export type ReplaceMode = 'split' | 'replace-selection' | 'replace-headings';

export default class NRDoc {
    private settings: NoteRefactorSettings;
    private templatePlaceholders: NotePlaceholders;
    private momentRegex: MomentDateRegex;
    private vault: Vault;
    private fileManager: FileManager;
    
    constructor(settings: NoteRefactorSettings, vault: Vault, fileManager: FileManager){
        this.settings = settings;
        this.vault = vault;
        this.fileManager = fileManager;
        this.templatePlaceholders = new NotePlaceholders();
        this.momentRegex = new MomentDateRegex();
    }

    removeNoteRemainder(doc:Editor, text:string): void {
        const currentLine = doc.getCursor();
        const endPosition = doc.offsetToPos(doc.getValue().length);
        doc.replaceRange(text, currentLine, endPosition);
    }

    async replaceContent(fileName: string, filePath: string, doc:Editor, currentNote: TFile, content: string, originalContent: string, mode: ReplaceMode): Promise<void> {
        const transclude = this.settings.transcludeByDefault ? '!' : '';
        const link = await this.markdownLink(filePath);
        const currentNoteLink = await this.markdownLink(currentNote.path);
        let contentToInsert = transclude + link;
        
        contentToInsert = this.templatedContent(contentToInsert, this.settings.noteLinkTemplate, currentNote.basename, currentNoteLink, fileName, link, '', content);

        if(mode === 'split'){ 
            this.removeNoteRemainder(doc, contentToInsert);
        } else if(mode === 'replace-selection') {
            doc.replaceSelection(contentToInsert);
        } else if(mode === 'replace-headings'){
          doc.setValue(doc.getValue().replace(originalContent, contentToInsert));
        }
    }

    async markdownLink(filePath: string){
      const file = await this.vault.getMarkdownFiles().filter(f => f.path === filePath)[0];
      const link = await this.fileManager.generateMarkdownLink(file, '', '', '');
      console.log('Settings aware md link', link);
      return link;
    }

    templatedContent(input: string, template: string, currentNoteTitle: string, currentNoteLink: string, newNoteTitle: string, newNoteLink: string, newNotePath: string, newNoteContent: string): string {
      if(template === undefined || template === ''){
        return input;
      }
      let output = template;
      output = this.momentRegex.replace(output);
      output = this.templatePlaceholders.title.replace(output, currentNoteTitle);
      output = this.templatePlaceholders.link.replace(output, currentNoteLink);
      output = this.templatePlaceholders.newNoteTitle.replace(output, newNoteTitle);
      output = this.templatePlaceholders.newNoteLink.replace(output, newNoteLink);
      output = this.templatePlaceholders.newNoteContent.replace(output, newNoteContent);
      output = this.templatePlaceholders.newNotePath.replace(output, newNotePath);
      return output;
    }

    selectedContent(doc:Editor): string[] {
      const selectedText = doc.getSelection()
      const trimmedContent = selectedText.trim();
      return trimmedContent.split('\n')
    }
  
    noteRemainder(doc:Editor): string[] {
      doc.setCursor(doc.getCursor().line, 0);
      const currentLine = doc.getCursor();
      const endPosition = doc.offsetToPos(doc.getValue().length);
      const content = doc.getRange(currentLine, endPosition);
      const trimmedContent = content.trim();
      return trimmedContent.split('\n');
    }

    contentSplitByHeading(doc:Editor, headingLevel: number): string[][] {
      const content = doc.getValue().split('\n');
      const parentHeading = new Array(headingLevel).join('#') + ' ';
      const heading = new Array(headingLevel + 1).join('#') + ' ';
      const matches: string[][] = [];
      let headingMatch: string[] = [];
      content.forEach((line, i) => {
        if(line.startsWith(heading)){
          if(headingMatch.length > 0) {
            matches.push(headingMatch);
            headingMatch = [];
            headingMatch.push(line);
          } else {
            headingMatch.push(line);
          }
        } else if(headingMatch.length > 0 && !line.startsWith(parentHeading)  ){
          headingMatch.push(line);
        } else if(headingMatch.length > 0) {
          matches.push(headingMatch);
          headingMatch = [];
        }
        //Making sure the last headingMatch array is added to the matches
        if(i === content.length - 1 && headingMatch.length > 0){
          matches.push(headingMatch);
        }
      });
      return matches;
    }
  
    
    noteContent(firstLine:string, contentArr:string[], contentOnly?:boolean): string {
      if(this.settings.includeFirstLineAsNoteHeading){
        //Replaces any non-word characters whitespace leading the first line to enforce consistent heading format from setting
        const headingBaseline = firstLine.replace(HEADING_REGEX, '');
        //Adds formatted heading into content array as first item. 
        //Trimming allows for an empty heading format. 
        contentArr.unshift(`${this.settings.headingFormat} ${headingBaseline}`.trim());
      } else if(!this.settings.excludeFirstLineInNote || contentOnly){
        //Adds first line back into content if it is not to be included as a header or if the command is content only
        contentArr.unshift(firstLine);
      }
      return contentArr.join('\n').trim();
    }
}