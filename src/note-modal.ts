import { App, FuzzySuggestModal, MarkdownView, SuggestModal, TFile } from 'obsidian';
import ModalNoteCreation from './modal-note-creation';
const EMPTY_TEXT = 'No files found to append content. Enter to create a new one.'
const PLACEHOLDER_TEXT = 'Type file to append to or create';
const instructions = [
    {command: '↑↓', purpose: 'to navigate'},
    {command: '↵', purpose: 'to append content to file'},
    {command: 'esc', purpose: 'to dismiss'}
];

export default class NoteRefactorModal extends FuzzySuggestModal<TFile>{
    modalNoteCreation: ModalNoteCreation;
    files: TFile[];
    newNoteResult: HTMLDivElement;
    suggestionEmpty: HTMLDivElement;
    obsFile: any;
    noSuggestion: boolean;

    constructor(app: App, modalNoteCreation: ModalNoteCreation) {
        super(app);
        this.modalNoteCreation = modalNoteCreation;
        this.init();
    }

    init() {
        this.files = this.app.vault.getMarkdownFiles();
        this.emptyStateText = EMPTY_TEXT;
        this.setPlaceholder(PLACEHOLDER_TEXT);
        this.setInstructions(instructions);
        this.initNewNoteItem();
    }
        
    getItems(): TFile[] {
        return this.files;
    }
    
    getItemText(item: TFile): string {
        this.noSuggestion = false;
        return item.basename;
    }
    
    onNoSuggestion() {
        this.noSuggestion = true;
        this.resultContainerEl.childNodes.forEach(c => c.parentNode.removeChild(c));
        this.newNoteResult.innerText = this.inputEl.value;
        this.itemInstructionMessage(this.newNoteResult, 'Enter to create');
        this.resultContainerEl.appendChild(this.newNoteResult);
        this.resultContainerEl.appendChild(this.suggestionEmpty);
    }
    
    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        if(this.noSuggestion) {
            this.modalNoteCreation.create(this.inputEl.value);
        } else {
            this.modalNoteCreation.append(item);
        }
    }
    
    initNewNoteItem() {
        this.newNoteResult = document.createElement('div');
        this.newNoteResult.addClasses(['suggestion-item', 'is-selected']);
        this.suggestionEmpty = document.createElement('div');
        this.suggestionEmpty.addClass('suggestion-empty');
        this.suggestionEmpty.innerText = EMPTY_TEXT;
    }

    itemInstructionMessage(resultEl: HTMLElement, message: string) {
        const el = document.createElement('kbd');
        el.addClass('suggestion-hotkey');
        el.innerText = message;
        resultEl.appendChild(el);
    }
    
}