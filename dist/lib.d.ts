import { Page } from "playwright";
declare type Config = {
    page: Page;
    clientKey: string;
    websiteUrl: string;
    selector: any;
    cookies?: string;
};
export declare function solveCaptcha(config: Config): Promise<boolean>;
export {};
//# sourceMappingURL=lib.d.ts.map