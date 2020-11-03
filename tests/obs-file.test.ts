import 'mocha';
import { assert } from 'chai';
import { App, EventRef, MarkdownView, TFile, TFolder, Vault, View, Workspace, WorkspaceLeaf } from 'obsidian';
import { Location } from 'src/settings';
import ObsidianFile from 'src/obsidian-file';
import { NoteRefactorSettings } from 'src/settings';
import { createMock } from 'ts-auto-mock';
import { PartialDeep } from 'ts-auto-mock/partial/partial';
import { ViewState } from 'obsidian-sample-plugin';

interface IObsidianApp {
    vault: IVault;
    workspace: IWorkspace;
    metadataCache: IMetadataCache;
    on: EventRef;
    off: void;
    offref: void;
    trigger: void;
    tryTrigger: void;
}

interface IVault {

}

interface IWorkspace {

}

interface IMetadataCache {

}

const mock = createMock<App>();
const viewState = createMock<ViewState>();
mock.workspace = createMock<Workspace>();
const parent = createMock<TFolder>();
parent.path = '/Inbox/New';
const view = createMock<MarkdownView>();
const file = createMock<TFile>();
file.parent = parent;
view.file = file;

const settings = new NoteRefactorSettings();
settings.newFileLocation = Location.SameFolder
const obsFile = new ObsidianFile(settings, mock);


describe("Note content - Content Only", () => {
    it("Returns current folder path", () => {
        const filePath = obsFile.filePath(view);
        assert.equal(filePath, '/Inbox/New');
    });
});