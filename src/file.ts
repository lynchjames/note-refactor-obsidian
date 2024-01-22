import { FILE_NAME_REGEX } from "./constants";
import { NoteRefactorSettings } from "./settings";
import MomentDateRegex from "./moment-date-regex";

export default class NRFile {
	private settings: NoteRefactorSettings;
	private momentDateRegex: MomentDateRegex;

	constructor(setting: NoteRefactorSettings) {
		this.settings = setting;
		this.momentDateRegex = new MomentDateRegex();
	}

	sanitisedFileName(unsanitisedFilename: string): string {
		const headerRegex = FILE_NAME_REGEX;
		const prefix = this.fileNamePrefix();
		const checkedPrefix = unsanitisedFilename.startsWith(prefix) ? "" : prefix;

		if(this.settings.onlyUsePrefixAsFileName){
			return checkedPrefix;
		}
		
		return (
			checkedPrefix +
			unsanitisedFilename.replace(headerRegex, "").trim().slice(0, 255)
		);
	}

	fileNamePrefix(): string {
		return this.settings.fileNamePrefix
			? this.momentDateRegex.replace(this.settings.fileNamePrefix)
			: "";
	}

	ensureUniqueFileNames(headingNotes: string[][]): string[] {
		const fileNames: string[] = [];
		const deduped = headingNotes.map((hn) => {
			const fileName = this.sanitisedFileName(hn[0]);
			const duplicates = fileNames.filter((fn) => fn == fileName);
			fileNames.push(fileName);
			return duplicates.length >= 1
				? `${fileName}${duplicates.length + 1}`
				: fileName;
		});
		return deduped;
	}
	getNewTitle(firstLine: string): string {
		return firstLine.replace(/^#+ /, "").trim();
	}
}
