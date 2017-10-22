const path = require('path');
const puppeteer = require('puppeteer');
const rimraf = require('rimraf');

async function removeFiles(mod) {
    return new Promise((rs, rj) => {
        let sourcePath = path.join(__dirname, `../source/${mod}/*`);
        // 先移除文件
        rimraf(sourcePath, {}, err => {
            if (!err) {
                console.log(`remove ${sourcePath} success`)
                rs()
            } else {
                console.log(`remove ${sourcePath} fail: `, err)
                rj()
            }
        })
    })
}

let cmdArgs = process.argv.slice(2);
let mods = cmdArgs.filter(mod => !/^-/.test(mod));
let npmArgs = JSON.parse(process.env.npm_config_argv).original;
let showHead = npmArgs.some(arg => arg == '-showhead');

async function run() {
    console.log('launching browser...')
    let browser = await puppeteer.launch({headless: showHead ? false : true});

    // 并行
    await Promise.all(mods.map(async function(mod) {
        // 移除旧文件
        await removeFiles(mod)

    	try {
	    	return require(`./${mod}`).run(browser)
	    } catch(e) {
	    	console.warn(`Cannot find Module ./${mod}`, e)
	    	return Promise.resolve(1)
	    }
    }))

    console.log(`closing browser...`)
    browser.close();
}

run()