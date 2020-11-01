import 'mocha';
import { assert } from 'chai';
import moment from 'moment';
import MomentDateRegex from '../src/moment-date-regex';
const date = new Date(2020, 9, 31, 14, 25, 15);
const momentRegex = new MomentDateRegex();

describe("Date formatting", () => {

    it("No date format formatting using standad format", () => {
        const input = 'Zettels/{{date}}';
        const expectedOuput = 'Zettels/202010311425';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });

    it("YYYYMMDD format", () => {
        const input = 'Zettels/{{date:YYYYMMDD}}';
        const expectedOuput = 'Zettels/20201031';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });

    it("Multiple dates", () => {
        const input = 'Zettels/{{date:YYYY}}/{{date:MMM}}/{{date:DD_ddd}}';
        const expectedOuput = 'Zettels/2020/Oct/31_Sat';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });

    it("Date prefixing", () => {
        const input = '{{date:YYYY}}/{{date:MM}}/My Notes';
        const expectedOuput = '2020/10/My Notes';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });

    it("Text between date targets", () => {
        const input = '{{date:YYYY}}/Zettels/{{date:MMMM}}';
        const expectedOuput = '2020/Zettels/October';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });
});

describe("Non-date input", () => {

    it("Input without dates", () => {
        const input = 'Inbox/New';
        const expectedOuput = 'Inbox/New';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });

    it("Input with date format without date target", () => {
        const input = 'Inbox/YYYY';
        const expectedOuput = 'Inbox/YYYY';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });

    it("Input with date format and partial date target", () => {
        const input = 'Inbox/{{date:YYYY';
        const expectedOuput = 'Inbox/{{date:YYYY';
        
        assert.equal(momentRegex.replace(input, date), expectedOuput);
    });
});