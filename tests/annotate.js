// add .env file to this folder with p4 vars to test

(async ()=>{
    const customEnv = require('custom-env'),
        assert = require('madscience-node-assert'),
        process = require('process'),
        perforcehelper = require('./../index')

    customEnv.env() 
    const p4user = process.env.p4user,
        p4password = process.env.p4password,
        p4port = process.env.p4port,
        annotate_file = process.env.annotate_file

    console.log(`using p4 settings`)
    console.log(`p4user:${p4user}`)
    console.log(`p4port:${p4port}`)
    console.log(`annotate_file:${annotate_file}`)
    
    try {

        const rawAnnotate = await perforcehelper.getAnnotate(p4user, p4password, p4port, annotate_file)
        assert.notNull(rawAnnotate)
        console.log(rawAnnotate)
        console.log('annotate lookup passed')

        const parsedAnnotate = await perforcehelper.parseAnnotate(rawAnnotate)
        assert.notNull(parsedAnnotate.revision)
        assert.notEmpty(parsedAnnotate.lines)
        console.log(parsedAnnotate)
        console.log('annotate parse passed')

    } catch(ex){
        console.error(`ERROR`, ex)
    }


})()

