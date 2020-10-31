import { Editor } from 'codemirror';
import { NoteRefactorSettings } from './settings';

export default class NRDoc {
    settings: NoteRefactorSettings;
    constructor(settings: NoteRefactorSettings){
        this.settings = settings;
    }
    removeNoteRemainder(doc:Editor, text:string): void {
        const currentLine = doc.getCursor();
        const endPosition = doc.posFromIndex(doc.getValue().length);
        doc.replaceRange(text, currentLine, endPosition);
    }

    replaceContent(fileName:string, doc:Editor, split?:boolean): void {
        const internalLink = `[[${fileName}]]`;
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
    
      
      noteContent(firstLine:string, contentArr:string[]): string {
        if(this.settings.includeFirstLineAsNoteHeading){
          //Replaces any non-word characters whitespace leading the first line to enforce consistent heading format from setting
          const headingRegex = /^[#\s-]*/;
          const headingBaseline = firstLine.replace(headingRegex, '');
          //Adds formatted heading into content array as first item. 
          //Trimming allows for an empty heading format. 
          contentArr.unshift(`${this.settings.headingFormat} ${headingBaseline}`.trim());
        } else if(this.settings.includeFirstLineInNote){
          //Adds first line back into content if it is not to be included as a header
          contentArr.unshift(firstLine);
        }
        return contentArr.join('\n').trim()
      }
}