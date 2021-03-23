// tests both changes and describe
// add .env file to this folder with p4 vars to test

(async ()=>{
    const customEnv = require('custom-env'),
        assert = require('madscience-node-assert'),
        process = require('process'),
        perforcehelper = require('./../index')

    customEnv.env() 
    const p4user = process.env.p4user,
        p4password = process.env.p4password,
        p4port = process.env.p4port

    console.log(`using p4 settings`)
    console.log(`p4user:${p4user}`)
    console.log(`p4port:${p4port}`)
    
    let revisionNumber

    try {
        const changes = await perforcehelper.getChanges(p4user, p4password, p4port),
            parsedChanges = perforcehelper.parseChanges(changes)

        assert.notNull(parsedChanges)
        // first item in list is latest in history
        revisionNumber = parsedChanges[0].revision

        console.log(`revisionNumber :`, revisionNumber)
        console.log('parseChanges test passed')

    } catch(ex){
        console.error(`ERROR`, ex)
    }

    try {
        const describe = await perforcehelper.getDescribe(p4user, p4password, p4port, revisionNumber),
            parsedDescribe = perforcehelper.parseDescribe(describe)

        assert.notNull(parsedDescribe)

        console.log(`parsedDescribe :`, parsedDescribe)
        console.log('parseDescribe test passed')
    } catch(ex){
        console.error(`ERROR`, ex)
    }
})()

