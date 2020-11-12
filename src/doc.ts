import { Editor } from 'codemirror';
import { HEADING_REGEX } from './constants';
import MomentDateRegex from './moment-date-regex';
import { NotePlaceholders } from './placeholder';
import { NoteRefactorSettings } from './settings';

export default class NRDoc {
    private settings: NoteRefactorSettings;
    private templatePlaceholders: NotePlaceholders;
    private momentRegex: MomentDateRegex;
    
    constructor(settings: NoteRefactorSettings){
        this.settings = settings;
        this.templatePlaceholders = new NotePlaceholders();
        this.momentRegex = new MomentDateRegex();
    }

    removeNoteRemainder(doc:Editor, text:string): void {
        const currentLine = doc.getCursor();
        const endPosition = doc.posFromIndex(doc.getValue().length);
        doc.replaceRange(text, currentLine, endPosition);
    }

    replaceContent(fileName:string, doc:Editor, currentNoteTitle: string, content: string, split?:boolean): void {
        const transclude = this.settings.transcludeByDefault ? '!' : '';
        let contentToInsert = `${transclude}[[${fileName}]]`;
        
        contentToInsert = this.templatedLinkContent(contentToInsert, currentNoteTitle, fileName, content);

        if(split){ 
            this.removeNoteRemainder(doc, contentToInsert);
        } else {
            doc.replaceSelection(contentToInsert);
        }
    }

    private templatedLinkContent(input: string, currentNoteTitle: string, newNoteTitle: string, newNoteContent: string): string {
      if(this.settings.noteLinkTemplate === undefined || this.settings.noteLinkTemplate === ''){
        return input;
      }
      let output = this.settings.noteLinkTemplate;
      output = this.momentRegex.replace(output);
      output = this.templatePlaceholders.newNoteTitle.replace(output, newNoteTitle);
      output = this.templatePlaceholders.newNoteContent.replace(output, newNoteContent);
      output = this.templatePlaceholders.title.replace(output, currentNoteTitle);
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
      const endPosition = doc.posFromIndex(doc.getValue().length);
      const content = doc.getRange(currentLine, endPosition);
      const trimmedContent = content.trim();
      return trimmedContent.split('\n');
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
      return contentArr.join('\n').trim()
    }
}