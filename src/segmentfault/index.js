/**
 * 爬取segmentfault专栏中周热门跟js相关的文章，保存标题和链接、作者到json文件中
 * @author DMQ
 */

const path = require('path');
const fs = require('fs');
const Logger = require('../utils/logger');

const prefix = '[segmentfault]'
let pageUrl = 'http://segmentfault.com/blogs/hottest/weekly';
let sourceDir = path.join(__dirname, '../../source/segmentfault');
let keywords = ['js', 'javascript', 'node', 'css', 'html', '前端', 'vue', 'react', 'angular', '爬虫'];
let blogCount = 50;

function writeFile(filename, data) {
    try {
        fs.writeFile(`${sourceDir}/${filename}`, data)
        Logger.log(prefix, `save segmentfault data success!`)
    } catch(e) {
        Logger.log(prefix, `save segmentfault data fail: `, e)
    }
}

// 逐个打开文章，过滤出标签和关键词匹配的文章
async function filterBlogs(blogs = [], browser) {
    let detailPage = await browser.newPage();
    let filterBlogs = [];

    for (let i = 0; i < blogs.length; i++) {
        let blog = blogs[i];
        await detailPage.goto(blog.url, {timeout: 5000}).catch(e => Logger.log(prefix, e))
        await detailPage.waitForSelector('.blog-type-common')
        let tags = await detailPage.evaluate(keywords => {
            let $keys = [...document.querySelectorAll('.tagPopup a')]   // 找到标签元素列表
            let keysArr = $keys.map(key => key.innerText)   // 取出标签内容

            // 多个标签中，只要一个标签在关键词中，则符合条件
            if (keysArr.some(key => keywords.some(keyword => keyword == key))) {
                return keysArr
            }
        }, keywords)

        if (tags && tags.length > 0) {
            Logger.log(prefix, `finish: ${blog.title}`)
            blog.tags = tags;
            filterBlogs.push(blog)
        }
    }

    detailPage.close()
    return filterBlogs
}

async function run(browser) {
    let page = await browser.newPage();
    Logger.log(prefix, `opening ${pageUrl}...`);
    await page.goto(pageUrl).catch(e => Logger.log(prefix, e));
    
    let blogListSelector = '.stream-list .summary';
    let nextPageSelector = '.pagination .next a';
    let blogs = [], hasNextPage = false, newBlogs = [];

    while (1) {
        // 通过dom选择器找到页面目录节点，取出链接和标题
        [blogs, hasNextPage] = await page.evaluate((blogsSel, nextSel) => {
            let $els = [...document.querySelectorAll(blogsSel)]

            return [$els.map(el => {
                let $title = el.querySelector('.title a')
                let $author = el.querySelector('.author span a')

                return {
                    url: $title.href,
                    title: $title.innerText,
                    author: $author.innerText,
                    authorHomePage: $author.href
                }
            }), !!document.querySelector(nextSel)]

        }, blogListSelector, nextPageSelector)

        // 逐个打开文章，过滤出标签和关键词匹配的文章
        newBlogs = newBlogs.concat(await filterBlogs(blogs, browser))

        if (!hasNextPage || newBlogs.length > blogCount) {
            Logger.log(prefix, 'crawl segmentfault done!')
            break ;
        }

        try {
            Logger.log(prefix, `opening next page...`)
            await page.click(nextPageSelector)
            await page.waitForNavigation({waitUntil: 'networkidle', timeout: 60000})
        } catch (e) {
            Logger.log(prefix, `crawl segmentfault stop：`, e)
            break
        }
    }
 
    writeFile('hotblogs.json', JSON.stringify(newBlogs, null, 2))
    page.close()
}

module.exports = {run}