
const http = require("http");
const util = require("util");
const host = '0.0.0.0';
const port = 40806;
const fs = require('fs')
const exec = util.promisify(require('child_process').exec);
const os = require('os');
const path = require("path");

const sshDir = path.join(os.homedir(), '.ssh') 

function mutate(s) {
    return function splice() {
        var a = s.split('');
        Array.prototype.splice.apply(a, arguments);
        return a.join('');
    };
}


const requestListener = async (req, res) => {
    let profiles = {}
    const profileName = req.url.split('/')[1]

    try {
        const file = path.join(sshDir, 'git-ssh-profiles.json')
        profiles = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch { }

    const profile = profiles[profileName]

    if (!profile) {
        res.writeHead(400);
        res.end(`<script>window.close()</script>`);
        return
    }
    await exec(`git config --global user.name "${profile.name}"`)
    await exec(`git config --global user.email "${profile.email}"`)

    // git config --global user.name "John Doe"
    // git config --global user.email johndoe@example.com
    // ~/.ssh/config


    const startTemplate = '## git-ssh-profiles start ##\n'
    const endTemplate = '## git-ssh-profiles end ##\n'

    const resultString = `${startTemplate}` +
        `Host github.com\n` +
        `    HostName github.com\n` +
        `    User git\n` +
        `    IdentityFile ${path.join(sshDir, profile.identityFile)}\n` +
        `${endTemplate}`



    let config = ''

    try {
        config = fs.readFileSync(path.join(sshDir, 'config'), 'utf8')
    } catch (e) {
        console.log(e);
        res.end(e);
    }

    const startIndex = config.indexOf(startTemplate)
    const endIndex = config.indexOf(endTemplate)
    console.log(config);

    if ((startIndex === -1) !== (endIndex === -1)) {
        const msg = 'corrupted config. check it and delete git-ssh-profiles'
        console.error(msg)
        res.writeHead(500);
        res.end(msg)
        return
    }
    console.log({ startIndex, endIndex });

    if ((startIndex !== -1) && (endIndex !== -1)) {
        console.log(config);
        config = mutate(config)(startIndex, endIndex + endTemplate.length - 1, resultString)
        console.log(config);
    } else {
        config += resultString
    }

    fs.writeFileSync(path.join(sshDir, 'config'), config, { encoding: "utf8" })

    res.writeHead(200);
    res.end(`<script>window.close()</script>`);

};

const server = http.createServer(async (req, res)=>{
    try {
        await requestListener(req, res)
    } catch (error) {
        res.writeHead(500);
        res.end(`${error}` );
        console.error(error);
    }
});
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
