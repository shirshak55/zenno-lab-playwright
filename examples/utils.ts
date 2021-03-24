import { BrowserContext, firefox } from "playwright"
import "source-map-support/register"

let handles: Array<BrowserContext> = []

let browser: any = null
export async function getBrowser() {
    if (browser !== null) {
        return browser
    }
    browser = await firefox.launch({
        headless: false,
    })

    return browser
}

export async function newContext(id: number, config?: any): Promise<BrowserContext> {
    let contextArgs: any = {
        ignoreHTTPSErrors: true,
        userAgent:
            (config && config.userAgent) ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0",
        viewport: null,
    }

    let browser = await getBrowser()
    let context = await browser.newContext(contextArgs)
    handles[id] = context

    return handles[id]
}

export async function newPage(context: BrowserContext) {
    let page = await context.newPage()

    // Make bot faster by not loading unnecessary overhead
    await page.route("**/*.{png,jpg,jpeg,gif,mp4,avi}*", (route) => route.abort())

    return page
}
