const exec = require('madscience-node-exec'),
    standardLineEndings = (text) =>{
        return text.replace(/\r\n/g, '\n')
    },
    find = (text, regex) =>{
        const lookup = text.match(regex)
        return lookup ? lookup.pop() : null
    },
    p4EnsureSession = async(username, password, host)=>{
        await exec.sh({ cmd : `p4 set P4USER=${username} && p4 set P4PORT=${host} && echo ${password} | p4 login`})
    }

module.exports = {


    /**
     * 
     */
    async getDescribe(username, password, host, revision){
        await p4EnsureSession(username, password, host) 
        const p4result = await exec.sh({ cmd : ` p4 describe ${revision}`})
        if (p4result.code !== 0)
            throw changes

        return p4result.result
    },


    /**
     * Converts "p4 describe <REVISION_NUMBER>" into a revision object with following members. All are string, except files, which is an array of objects described below.
     * { 
     *      revision : STRING, 
     *      description : STRING,
     *      date : STRING, 
     *      username : STRING,
     *      workspace: STRING, name of workspace changeset was submitted from 
     *      files : OBJECT (see below)
     * }
     * 
     * Input looks like
     *
     * Change 0001 by p4bob@wors-space on 2021/01/25 14:38:07
     *   
     *      Lots of changes
     *
     * Affected files ...
     *
     * ... //mydepot/mystream/path/to/file.txt#2 edit
     *
     * Differences ...
     *
     * ==== //mydepot/mystream/path/to/file.txt#2 (text) ====
     * 
     * 65c65,68
     * <       some hello worlding
     * ---
     * >       farewhatever
     *
     *
     * Files objects have the following string members. File is the path
     * { 
     *      file : STRING. Path of file in depot, 
     *      change : STRING. Change type matching the following values (add, edit, delete) 
     *      differences : STRING ARRAY. Changes to file if file is text.
     * }
     * 
     */
    parseDescribe (rawDescribe, parseDifferences = true){

        // convert all windows linebreaks to unix 
        rawDescribe = standardLineEndings(rawDescribe)

        // s modifier selects across multiple lines
        let description =  find(rawDescribe, /\n(.*?)\nAffected files .../is),
            files = [],
            // affected files is large block listing all files which have been affected by revision
            affectedFiles = find(rawDescribe, /\nAffected files ...\n(.*?)\nDifferences .../is),
            // multiline grab
            differences = find(rawDescribe, /\nDifferences ...\n(.*)/is)

        affectedFiles = affectedFiles || ''
        affectedFiles = affectedFiles.split('\n')

        differences = differences || ''
        differences = differences.split('\n==== ')
        description = description || ''
        
        for (const affectedFile of affectedFiles){
            const match = affectedFile.match(/... (.*)#[\d]+ (delete|add|edit)$/i)
            if (!match || match.length < 2)
                continue

            const item = {
                file : match[1],
                change : match[2]
            }

            // try to get difference
            if (parseDifferences)
                for (const difference of differences){
                    const file = find(difference, /(.*?)#[\d]+ .+ ====/i)
                    if (file === match[1]){
                        item.differences = find(difference, /#.+====(.*)/is)
                            .split(`\n`)
                            .filter( item => !!item.length)
                    }
                }

            files.push(item)
        }

        description = description.split(`\n`)
        description = description.map(line => line.trim())
        description = description.filter(line => !!line.length) //remove empty lines
        description = description.join(' ')

        return {
            revision : find(rawDescribe, /change ([\d]+) /i),
            workspace : find(rawDescribe, /change [\d]+ by .+@(.*) on /i),
            date : find(rawDescribe, /change [\d]+ by .+ on (.*?) /i) ,
            username : find(rawDescribe, /change [\d]+ by (.*)@/i) ,
            files,
            description
        }
    },


    /**
     * Parses standard p4 changes output into objects with following structure
     * {
     *      revision : NUMERIC
     *      date : DATE
     *      username : STRING
     *      workspace : STRING
     *      description : STRING
     * }
     */
    parseChanges(rawChanges){
        let changes = [],
            currentChange = null

        rawChanges = standardLineEndings(rawChanges)
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
                currentChange.username = find(changeLine, /change [\d]+ on .+ by (.*)@/i) 
                currentChange.workspace = find(changeLine, /change [\d]+ on .+ by .+@(.*)/i) 
                currentChange.date = find(changeLine, /change [\d]+ on (.*?) by /i) 
                currentChange.date = currentChange.date ? new Date(currentChange.date) : currentChange.date
                currentChange.revision = currentChange.revision ? parseInt(currentChange.revision) : currentChange.revision
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
        await p4EnsureSession(username, password, host)
        const maxModifier = max ? `-m ${max}`:``
        const p4result = await exec.sh({ cmd : ` p4 changes ${maxModifier} -l ${path} `})
        if (p4result.code !== 0)
            throw changes

        return p4result.result
    }

    
}
