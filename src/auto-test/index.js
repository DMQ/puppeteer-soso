const path = require('path');
const expect = require('chai').expect;
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const account = require('./account')

let sourceDir = path.join(__dirname, '../../source/auto-test');

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
	await page.waitFor(2000)
	
	let needToLogin = await page.$('#login_main')

	if (needToLogin) {
		let loginFrame = page.frames().find(f => {
			return /^https?\:\/\/ui\.ptlogin2\.qq\.com\/cgi\-bin\/login/.test(f.url())
		})
		// 登录操作
		await loginFrame.evaluate((uinSelector, pswSelector, uin, psw) => {
			document.querySelector(uinSelector).setAttribute('value', uin)
			document.querySelector(pswSelector).setAttribute('value', psw)
		},uinSelector, pswSelector, account.uin, account.psw)

		let btnElem =  await loginFrame.$(btnSelector);
		await btnElem.click();

		// await page.waitForNavigation()
		await page.waitFor(2000)
	}

	return {browser, page};
}


describe('gamecenter', function() {
	describe('#首页：新游模块', function() {

			it('正确展示新游模块', async function() {
				this.timeout(15000)

				let {browser, page} = await openPage();

				let [newGame, width] = await page.evaluate(() => {
					let newCnt = document.querySelector('#new_container');
					return [newCnt, newCnt && newCnt.offsetWith || 0]
				})

				try {
					expect(newGame).to.be.exist;
					expect(width).to.be.above(0);
					page.close();
				} catch (e) {
					await page.screenshot({path: `${sourceDir}/newGame1.png`, fullPage: true})
					page.close();
					throw e
				}
			})

			it('预约功能是否正常', async function () {
				this.timeout(20000)

				let {browser, page} = await openPage();

				let reserveBtn = await page.$('.orderBtn')

				try {
					// 判断是否有预约按妞
					expect(reserveBtn).to.be.exist;

					let dialogBeforClick = await page.$('.appointment-dialog')
					await reserveBtn.click();
					await page.waitFor(2000);
					let dialogAfterClick = await page.$('.appointment-dialog')

					// 判断点击预约，弹窗是否正常
					expect(dialogBeforClick).to.be.not.exist;
					expect(dialogAfterClick).to.be.exist;

					let dialogWidth = await page.evaluate(dialog => {
						return dialog.offsetWith || 0
					}, dialogAfterClick)

					expect(dialogWidth).to.be.above(0)

					// 判断弹窗提示是否正确
					let titleTips = await page.evaluate(dialog => {
						return dialog.querySelector('#optionDialogHeader').innerText
					}, dialogAfterClick)

					expect(titleTips).to.equal('预约成功')

					// 判断按钮文案和样式是否变了
					let [reserveBtnText, reserveBtnClass] = await page.evaluate(btn => {
						return [btn.innerText, [...btn.classList]]
					}, reserveBtn)

					expect(reserveBtnText).to.equal('已预约')
					expect(reserveBtnClass).to.include('disabled')
					

					// 判断弹窗的确认按钮是否正常关闭弹窗
					let confirmBtn = page.$('#buttonsContainer button');
					await confirmBtn.click();
					await page.waitFor(200);

					let dialogClass = page.evaluate(dialog => {
						return [...dialog.classList]
					}, dialogAfterClick)

					expect(dialogClass).to.not.include('show')


				} catch (e) {
					await page.screenshot({path: `${sourceDir}/newGame2.png`, fullPage: true})
					page.close();
					throw e
				}
			})
	})
})