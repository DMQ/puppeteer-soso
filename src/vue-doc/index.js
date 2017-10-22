/**
 * 爬取阮一峰老湿的es文章，保存为pdf
 * @author DMQ
 */

const path = require('path');
const Logger = require('../utils/logger')

const prefix = '[ryf-es6]'

async function run(browser) {
    let page = await browser.newPage();
    let pageUrl = 'http://es6.ruanyifeng.com/';
    let listSelector = '#sidebar ol li a';
    let sourceDir = path.join(__dirname, '../../source/ryf-es6');
    let waitTime = 1000;

    Logger.log(prefix, `opening ${pageUrl}...`);
    await page.goto(pageUrl, {waitUntil: 'networkidle'}).catch(e => Logger.log(prefix, e));
    await page.waitFor(waitTime) // 等待页面加载完成

    // 通过dom选择器找到页面目录节点，取出链接和标题
    let tags = await page.evaluate(selector => {
        let els = [...document.querySelectorAll(selector)]

        return els.map(el => {
            return {
                url: el.href,
                title: el.innerText
            }
        })

    }, listSelector)


    let succCount = 0;

    for (let i = 0; i < tags.length; i++) {
        let tag = tags[i]

        Logger.log(prefix, `正在打开：${tag.url} ${tag.title}`)
        // 因为page.goto()对于只改变hash的链接跳转支持有bug，还未解决。所以重新建页面 
        // issue => https://github.com/GoogleChrome/puppeteer/issues/257
        // page = await browser.newPage()
        // update:
        // 在issue中有人提到 调用page.goto()跳转到只改变hash的链接时，可以传入{waitUntil: 'networkidle'}，来解决
        // 该参数表示，等待网络空闲的时候执行回调（这种方式一般针对单页应用，通过hash来做路由的页面有效，会产生网路请求）
        await page.goto(tag.url, { waitUntil: 'networkidle' }).catch(e => Logger.log(prefix, e))
        // await page.waitFor(waitTime) 

        Logger.log(prefix, `开始保存第${i+1}篇：${tag.title}`)
        try {
            await page.pdf({ path: `${sourceDir}/${tag.title}.pdf` })
            Logger.log(prefix, `保存pdf成功`);
            // await page.screenshot({ path: `${sourceDir}/${tag.title}.png`, fullPage: true })
            // Logger.log(prefix, `保存图片成功`);
            succCount++;
        } catch (e) {
            Logger.log(prefix, `保存失败：`, e);
        }
        Logger.log(prefix, `-----------------------------------`, `\n`)
    }

    Logger.log(prefix, `done! 共${tags.length}篇，${succCount}篇保存成功，${tags.length - succCount}篇保存失败`)
    page.close()
}

module.exports = {run}