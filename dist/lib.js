"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.solveCaptcha = void 0;
const got_1 = __importDefault(require("got"));
const delay_1 = __importDefault(require("delay"));
async function solveCaptcha(config) {
    let { page, clientKey, websiteUrl, cookies, selector } = config;
    /// Find the captcha handle / selector
    /// User of the library are responsbile to make sure the given selector exists
    let captchaHandle = await page.waitForSelector(selector);
    let siteKey = await captchaHandle.getAttribute("data-sitekey");
    if (!siteKey) {
        throw {
            name: "InvalidSiteKey",
            message: "unable to find site key",
        };
    }
    let dataS = await captchaHandle.getAttribute("data-s");
    let resp = await got_1.default.post("https://api.capmonster.cloud/createTask", {
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
    });
    let body = resp.body;
    if (!body.taskId) {
        throw {
            name: "BadResponseFromCapMoster",
            messages: "server gave bad resp",
            response: body,
        };
    }
    let captchaResp = null;
    let taskId = body.taskId;
    let taskTries = 0;
    // unconditional loops are very lovely just like rust lang loops :D
    while (true) {
        if (taskTries++ > 80) {
            throw {
                name: "TaskTimeOut",
                message: "Polling task took too long",
            };
        }
        let taskResp = await got_1.default.post("https://api.capmonster.cloud/getTaskResult", {
            json: {
                clientKey,
                taskId,
            },
            responseType: "json",
            throwHttpErrors: false,
        });
        let taskBody = taskResp.body;
        if (taskBody.status === "ready") {
            captchaResp = taskBody.solution.gRecaptchaResponse;
            break;
        }
        await delay_1.default(1000);
    }
    if (!captchaResp) {
        throw {
            name: "InvalidCaptchaRespFromServer",
            messages: "The server didn't gave gRecaptchaResponse",
        };
    }
    await page.evaluate(({ captchaHandle, captchaResp }) => {
        let textarea = document.createElement("textarea");
        textarea.id = "g-recaptcha-response";
        textarea.name = "g-recaptcha-response";
        textarea.value = captchaResp;
        captchaHandle.parentNode?.appendChild(textarea);
    }, { captchaHandle, captchaResp });
    return true;
}
exports.solveCaptcha = solveCaptcha;
