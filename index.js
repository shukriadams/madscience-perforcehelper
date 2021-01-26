let exec = require('madscience-node-exec')

const standardLineEndings = (text) =>{
    return text.replace(/\r\n/g, '\n')
}

const find = (text, regex) =>{
    const lookup = text.match(regex)
    return lookup ? lookup.pop() : null

}

module.exports = {

    /**
     * Converts "p4 describe <REVISION_NUMBER>" into a revision object with following members. All are string, except files, which is an array of objects described below.
     * { 
     *      revision : STRING, 
     *      description : STRING,
     *      date : STRING, 
     *      user : STRING,
     *      workspace: STRING, name of workspace changeset was submitted from 
     *      files : OBJECT (see below)
     * }
     * 
     * 
     * Files objects have the following string members. File is the path
     * { 
     *      file : STRING. Path of file in depot, 
     *      change : STRING. Change type matching the following values (add, edit, delete) 
     * }
     * 
     */
    
    async describe (username, password, revision){
        let logItems = null

        // convert all windows linebreaks to unix 
        desribeLog = desribeLog.replace(/\r\n/g, '\n')

        return {
            revision,
            description,
            workspace,
            files,
            date,
            user,
        }
    },



    parseChanges(rawChanges){
        let changes = [],
            currentChange = null

        rawChanges = rawChanges.split('\n')
        rawChanges = rawChanges.filter(change => !!change.length) //remove empty itesm
            
        for (const changeLine of rawChanges){
            if (changeLine.startsWith('Change ')){
                currentChange = {
                    revision : null,
                    date : null,
                    username : null,
                    workspace : null,
                    description : ''
                }

                changes.push(currentChange)
            }

            if (changeLine.startsWith('Change ')){
                currentChange.revision = find(changeLine, /change ([\d]+) /i) 
                currentChange.date = find(changeLine, /change [\d]+ on (.*?) by /i) 
                currentChange.username = find(changeLine, /change [\d]+ on .+ by (.*)@/i) 
                currentChange.workspace = find(changeLine, /change [\d]+ on .+ by .+@(.*)/i) 
            } else {
                // remove tab chars, replace them with spaces as they server as spaces in formatted p4 messages.
                // trim to remove those spaces when added add beginning of commit message, where the \t is effectively used as a newline
                currentChange.description += changeLine.replace(`\t`, ' ').trim()
            }
        }

        return changes

    },

    /**
     * Gets an array of revision numbers from the given depot path. 
     */
    async getChanges(username, password, host, max, path = '//...',){
        exec.sh({ cmd : `p4 set P4USER=${username} && p4 set P4PORT=${host} && echo ${password} | p4 login`})
        const maxModifier = max ? `-m ${max}`:``
        const p4result = await exec.sh({ cmd : ` p4 changes ${maxModifier} -l ${path} `})
        if (p4result.code !== 0)
            throw changes

        return p4result.result
    }

    
}