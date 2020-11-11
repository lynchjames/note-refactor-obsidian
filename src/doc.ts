import { Editor } from 'codemirror';
import { HEADING_REGEX } from './constants';
import { NoteRefactorSettings } from './settings';

export default class NRDoc {
    private settings: NoteRefactorSettings;
    constructor(settings: NoteRefactorSettings){
        this.settings = settings;
    }

    removeNoteRemainder(doc:Editor, text:string): void {
        const currentLine = doc.getCursor();
        const endPosition = doc.posFromIndex(doc.getValue().length);
        doc.replaceRange(text, currentLine, endPosition);
    }

    replaceContent(fileName:string, doc:Editor, split?:boolean): void {
        const transclude = this.settings.transcludeByDefault ? '!' : '';
        const internalLink = `${transclude}[[${fileName}]]`;
        if(split){ 
            this.removeNoteRemainder(doc, internalLink);
        } else {
            doc.replaceSelection(internalLink);
        }
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