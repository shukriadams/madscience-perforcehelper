const exec = require('madscience-node-exec'),
    /**
     * Converts windows line endings to unix
     */
    standardLineEndings = text =>{
        return text.replace(/\r\n/g, '\n')
    },
    /**
     * tries to match the regex with the text, if found, returns result, else null 
     */
    find = (text, regex) =>{
        const lookup = text.match(regex)
        return lookup ? lookup.pop() : null
    },
    p4EnsureSession = async(username, password, host)=>{
        //await exec.sh({ cmd : `p4 set P4USER=${username} && p4 set P4PORT=${host} && echo ${password}| p4 login`})
        await exec.sh({ cmd : `p4 set P4USER=${username}`})
        await exec.sh({ cmd : `p4 set P4PORT=${host}`})
        await exec.sh({ cmd : `echo ${password}| p4 login`})
    }

module.exports = {


    /**
     * 
     */
    async getDescribe(username, password, host, revision){
        await p4EnsureSession(username, password, host) 
        const p4result = await exec.sh({ cmd : `p4 describe ${revision}`})
        if (p4result.code !== 0)
            throw p4result

        return p4result.result
    },


    /**
     * gets annotation (blame) on a given file
     * @param {string} username perforce user
     * @param {string} password perforce password
     * @param {string} host perforce address
     * @param {string} filePath to remote server to blame on. does not work on local files as no client is set here
     * @param {string} revision optional : a revision to take blame at
     */
    async getAnnotate(username, password, host, filePath, revision = ''){
        await p4EnsureSession(username, password, host)

        if (revision && !revision.startsWith('#')) 
            revision = `#${revision}`

        const p4result = await exec.sh({ cmd : `p4 annotate -c ${filePath}${revision}`})
        if (p4result.code !== 0)
            throw p4result

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
     * Parses annotate message from perforce. Message format looks like (all chevrons are mine)
     * 
     * //path/to/file - edit change <REVISION NR> (filetype)
     * <REVISION NR>: line 1 content
     * <REVISION NR>: line 2 content
     * <etc>.
     * 
     * Output is an object with structure :
     * {
     *     {string} revision : revision at which annotation was taken
     *     {string} file : file path of annotated file
     *     {string} type : (delete|add|edit)
     *     {Line} lines : array of Lines objects. Note that array index of object
     * }
     * 
     * Line object structure :
     * {
     *     {string} revision : revision that changed this line
     *     {string} text : line text
     *     {number} number : line nr. Matches array index.
     * }
     */
    parseAnnotate(rawAnnotate){
        // convert all windows linebreaks to unix 
        rawAnnotate = standardLineEndings(rawAnnotate)
        let lines = rawAnnotate.split('\n').filter (line => !!line), // split + remove empty
            revision = null,
            file = null,
            type = null,
            linesArray = []

        // parse out first line, this contains descriptoin
        if (lines.length > 0){
            file = find(lines[0], /^(.*?) -/)
            revision = find(lines[0], / change (.*?) \(/)
            type = find(lines[0], / - (.*?) change/)
        }

        if (lines.length > 1)
            // note we start start 2nd item in array
            for (let i = 1; i < lines.length ; i ++){
                const line = { }
                linesArray.push(line)
                line.revision = find(lines[i], /^(.*?):/)
                line.text = find(lines[i], /:(.*)$/)
                line.number = i 
            }

        return {
            file,
            type,
            revision,
            lines : linesArray
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
            throw p4result

        return p4result.result
    }

    
}
