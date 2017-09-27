const path = require('path');
const puppeteer = require('puppeteer');
const rimraf = require('rimraf');

function removeFiles(mod) {
    let sourcePath = path.join(__dirname, `../source/${mod}/*`);
    // 先移除文件
    rimraf(sourcePath, {}, err => {
        if (!err) {
            console.log(`remove ${sourcePath} success`)
        } else {
            console.log(`remove ${sourcePath} fail: `, err)
        }
    })
}

let cmdArgs = [...process.argv].slice(2);
let mods = cmdArgs.filter(mod => !/^-/.test(mod));
let showHead = cmdArgs.some(arg => arg == '-showhead');

async function run() {
    console.log('launching browser...')
    let browser = await puppeteer.launch({headless: showHead ? false : true});

    // 并行
    await Promise.all(mods.map(mod => {
        // 移除旧文件
        removeFiles(mod)

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