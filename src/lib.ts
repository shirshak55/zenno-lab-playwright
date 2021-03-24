import { Page } from "playwright"
import got from "got"
import delay from "delay"

//// First we need to find the captcha. For that we demand user to pass the selector
//// We demand user to pass selector just in case page has multiple captchas

//// After finding the captcha we shall contact the appropriate backend
//// like google recaptcha solver backend to solve the captcha
//// for now there is only google captcha solver
//// We shall poll the solving server and once solved we will
//// insert the appropriate verification token in form.

type Config = {
    page: Page
    clientKey: string
    websiteUrl: string
    selector: any
    cookies?: string
}

export async function solveCaptcha(config: Config) {
    let { page, clientKey, websiteUrl, cookies, selector } = config

    /// Find the captcha handle / selector
    /// User of the library are responsbile to make sure the given selector exists
    let captchaHandle = await page.waitForSelector(selector)

    let siteKey = await captchaHandle.getAttribute("data-sitekey")

    if (!siteKey) {
        throw {
            name: "InvalidSiteKey",
            message: "unable to find site key",
        }
    }

    let dataS = await captchaHandle.getAttribute("data-s")
    let resp = await got.post("https://api.capmonster.cloud/createTask", {
        json: {
            clientKey,
            task: {
                type: "NoCaptchaTaskProxyless",
                websiteURL: websiteUrl,
                websiteKey: siteKey,
                recaptchaDataSValue: dataS,
                cookies,
            },
        },
        responseType: "json",
        throwHttpErrors: false,
    })

    let body: any = resp.body

    if (!body.taskId) {
        throw {
            name: "BadResponseFromCapMoster",
            messages: "server gave bad resp",
            response: body,
        }
    }

    let captchaResp: string | null = null

    let taskId = body.taskId

    let taskTries = 0

    // unconditional loops are very lovely just like rust lang loops :D
    while (true) {
        if (taskTries++ > 80) {
            throw {
                name: "TaskTimeOut",
                message: "Polling task took too long",
            }
        }

        let taskResp = await got.post("https://api.capmonster.cloud/getTaskResult", {
            json: {
                clientKey,
                taskId,
            },
            responseType: "json",
            throwHttpErrors: false,
        })
        let taskBody: any = taskResp.body

        if (taskBody.status === "ready") {
            captchaResp = taskBody.solution.gRecaptchaResponse
            break
        }

        await delay(1000)
    }

    if (!captchaResp) {
        throw {
            name: "InvalidCaptchaRespFromServer",
            messages: "The server didn't gave gRecaptchaResponse",
        }
    }

    await page.evaluate(
        ({ captchaHandle, captchaResp }) => {
            let textarea = document.createElement("textarea")
            textarea.id = "g-recaptcha-response"
            textarea.name = "g-recaptcha-response"
            textarea.value = captchaResp
            captchaHandle.parentNode?.appendChild(textarea)
        },
        { captchaHandle, captchaResp }
    )

    return true
}
