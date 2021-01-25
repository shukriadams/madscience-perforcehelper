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
    describe (username, password, revision){
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


    /**
     * Gets an array of revision numbers from the given depot path. 
     */
    changes(username, password, host, path){
        const changes = []
        return changes
    }

    
}