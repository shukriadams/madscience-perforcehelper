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
    
    try {
        const changes = await perforcehelper.getChanges(p4user, p4password, p4port)
        const parsedChanges = perforcehelper.parseChanges(changes)
        assert.notNull(parsedChanges)
        console.log('test passed')
    } catch(ex){
        console.error(`ERROR`, ex)
    }
})()

