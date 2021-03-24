import { newContext, newPage } from "./utils"
import delay from "delay"
import { solveCaptcha } from "../"

export async function test_on_google_link() {
    let context = await newContext(1)
    let page = await newPage(context)

    await page.goto("https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high")

    let start = Date.now()

    // if (!process.env.clientKey) {
    //     throw "Please set client key"
    // }

    let cookies = await context.cookies()
    let scookies = cookies.map((v) => `${v.name} = ${v.value}`).join("; ")

    let status = await solveCaptcha({
        page,
        selector: ".g-recaptcha",
        clientKey: process.env.clientKey!,
        websiteUrl: page.url(),
        cookies: scookies,
    })

    if (status === true) {
        console.log("Appears to be succesfull. So lets click submit button")
    }
    // Was it succesfull?

    await page.click("input[class=submit]")

    let loopCount = 0
    while (loopCount++ <= 10) {
        let pageContents = await page.content()

        if (pageContents.includes("challenge_ts")) {
            console.log("Google Captcha has succesfully been solved?")

            let end = Date.now()

            let diffInTime = end - start
            let diffInSecs = diffInTime / 1000000 // JS uses microsecs (stupid)

            console.log(`Google captcha took ${diffInSecs} to solve`)
            return true
        }
        await delay(1000)
    }

    console.log("Err: Google captcha not solved. Bad Luck Perhaps???")
}
