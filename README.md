# madscience-perforcehelper

A NodeJS library of Perforce-related functions, parsers etc.

## Use 

Add to package.json :

    {
        "dependencies": {
            "madscience-svnhelper": "https://github.com/shukriadams/madscience-perforcehelper.git#0.0.1"
        }
    }

Note : does not install Perforce runtime, you will need to install this yourself. There are numerous way of doing that, one example is

    curl -sL https://cdist2.perforce.com/perforce/r20.1/bin.linux26x86_64/p4 --output /tmp/p4 
    sudo cp /tmp/p4  /usr/local/bin/ 
    sudo chmod +x /usr/local/bin/p4 

If your Perforce server uses SSL you also need to force trust

    p4 trust -i ssl:<your-server-ip>:<your-server-port> 
    p4 trust -f -y 

Import

    const perforcehelper = require('madscience-perforcehelper')

## Functions

All functions that access Perforce require usename/password/port. Also, all functions which access Perforce are separated from parsing functions, giving you the freedom
to use this lib as both an accessor or just a parser.

### Annotate

Blames a file

    const rawAnnotate = await perforcehelper.getAnnotate(p4user, p4password, p4port, annotate_file)
    
    const parsedAnnotate = await perforcehelper.parseAnnotate(rawAnnotate)

### Changes

Gets a list of changes

    const rawChanges = await perforcehelper.getChanges(p4user, p4password, p4port, max, path)
    
    const parsedChanges = perforcehelper.parseChanges(rawChanges)

### Describe

Gets information about a change

    const rawDescribe = await perforcehelper.getDescribe(p4user, p4password, p4port, revisionNumber)
    
    const parsedDescribe = perforcehelper.parseDescribe(rawDescribe)

## Testing

All functions are tested/demonstrated in ./test. 
