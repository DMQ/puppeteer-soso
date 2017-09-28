const expect = require('chai').expect;
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const account = require('./account')

let browser;
async function launchBrowser(headless) {
	return browser ? browser : (browser = await puppeteer.launch({headless}));
}

async function openPage() {
	let uinSelector = '#u', pswSelector = '#p', btnSelector = '#go';
	let pageUrl = 'http://m.gamecenter.qq.com/directout/index.v5?_bid=278&_wv=5127&gc_version=2&ADTAG=oldGamecenter&module=game';
	let mqqUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13F69 QQ/7.3.5.437 V1_IPH_SQ_7.3.5_1_APP_A Pixel/750 Core/UIWebView NetType/WIFI Mem/96';

	let browser = await launchBrowser(false);
	let page = await browser.newPage();

	// 设置webview
	let iPhone6 = devices['iPhone 6']
	iPhone6.userAgent = mqqUserAgent;
	await page.emulate(iPhone6)

	await page.goto(pageUrl)
	await page.waitForSelector('#login_main')

	let loginFrame = page.frames().find(f => {
		return /^https?\:\/\/ui\.ptlogin2\.qq\.com\/cgi\-bin\/login/.test(f.url())
	})


	// 登录操作
	await loginFrame.evaluate((uinSelector, pswSelector, uin, psw) => {
		document.querySelector(uinSelector).setAttribute('value', uin)
		document.querySelector(pswSelector).setAttribute('value', psw)
	},uinSelector, pswSelector, account.uin, account.psw)

	let btnElem =  await loginFrame.$(btnSelector);
	btnElem.click();

	await page.waitForNavigation()
	await page.waitFor(2000)

	return {browser, page};
}


describe('gamecenter', function() {
	describe('#首页：新游模块', function() {

		(async function () {
			let {browser, page} = await openPage();

			it('正确展示新游模块', async function() {
				this.timeout(10000)

				// let {browser, page} = await openPage();

				let hotGame = await page.evaluate(() => {
					return document.querySelector('#new_container')
				})

				page.close();

				expect(hotGame).to.exist;
			})

			it('预约功能是否正常', async function () {
				this.timeout(10000)

				// let {browser, page} = await openPage();
			})
		
		})()

		
	})
})