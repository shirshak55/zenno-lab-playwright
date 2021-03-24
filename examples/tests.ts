import { test_on_google_link } from "./test_on_google_link"

async function main() {
    await test_on_google_link().catch((e) => {
        console.log("Error on solving google captcha", e)
    })
}

main().catch((e) => {
    console.log("Error on Main", e)
})
