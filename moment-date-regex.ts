export default class MomentDateRegex {
    replace(input: string): string {
        //A regex to capture multiple matches, each with a target group ({date:YYMMDD}) and date group (YYMMDD)
        const dateRegex = /(?<target>{{date:?(?<date>[^}]*)}})/g;
        const customFolderString = input;
        //Iterating through the matches to collect them in a single array
        const matches = [];
        let match;
        while(match = dateRegex.exec(customFolderString)){
          matches.push(match)
        }
        //Returns the custom folder setting value if no dates are found
        if(!matches || matches.length === 0){
          return input;
        }
        const now = new Date();
        //Transforms date matches into moment formatted dates
        const formattedDates = matches.map(m => {
          const dateFormat = m.groups.date === '' ? 'YYYYMMDDHHmm' : m.groups.date;
          return [m.groups.target, (window as any)
            .moment(now)
            .format(dateFormat)];
        });
    
        //Check to see if any date formatting is needed. If not return the unformatted setting text.
        let output = customFolderString;
        formattedDates.forEach(fd => {
          output = output.replace(fd[0], fd[1]);
        })
        return output;
      }
}