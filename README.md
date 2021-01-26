# madscience-perforcehelper

A NodeJS library of Perfroce-related functions, parsers etc.

## Use 

Add to package.json :

    {
        "dependencies": {
            "madscience-svnhelper": "https://github.com/shukriadams/madscience-perforcehelper.git#0.0.1"
        }
    }

Import

    const perforcehelper = require('madscience-perforcehelper')

## Testing

p4v is already provisioned. Connect to your Perforce instance with 

    p4 set P4PORT=<ip>:<port>

If running on ssl force trust

    p4 trust -i <ip>:<port> 
    p4 trust -f -y 