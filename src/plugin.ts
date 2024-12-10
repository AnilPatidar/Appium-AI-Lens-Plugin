import { BasePlugin } from '@appium/base-plugin';
import { logger } from 'appium/support';
import { createNonStreamingMultipartContent } from './google-vertexai';
import { getCoordinatesByInput } from './google-vision';
const { getiOSDeviceMultiplier } = require('./utils/coordinate-finder');
import loki from 'lokijs';
const TAP_DURATION_MS = 250

const packageJson = require('../package.json');
const log = logger.getLogger('AI-APPIUM-LENS');

const path = require('path');
const fs = require('fs');

// Initialize LokiJS
const db = new loki('sessions.db');
const sessions = db.addCollection('sessions');

async function askGoogleVisionAI(instruction: string, encodedImg: string): Promise<any> {
    log.info(`Instruction Received`);
    let response;
    try {
        const projectId = process.env.GOOGLE_PROJECT_ID;
        const location = process.env.GOOGLE_LOCATION;
        const model = process.env.GOOGLE_MODEL;

        if (!projectId || !location || !model) {
            throw new Error('Google Cloud environment variables are not set');
        }
        response = await createNonStreamingMultipartContent(projectId, location,model, encodedImg, instruction);
        console.log("AI Response:", response);
    } catch (error) {
        console.error("Error processing the image or query:", error);
    }
    return response;
}

const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/ai-appium-lens');

class AIAppiumLens extends BasePlugin {
    constructor(pluginName: string) {
        super(pluginName);
    }

    shouldAvoidProxy(_method: any, route: string, _body: any): boolean {
        log.info(`Checking if route ${route} should be avoided`);
        return SOURCE_URL_REGEX.test(route);
    }

    static newMethodMap = {
        '/session/:sessionId/plugin/ai-appium-lens/askAI': {
            POST: {
                command: 'askAI',
                payloadParams: { required: ['instruction'] },
            },
        },
        '/session/:sessionId/plugin/ai-appium-lens/aiClick': {
            POST: {
                command: 'aiClick',
                payloadParams: { required: ['text','index', 'takeANewScreenShot'] },
            },
        },
        '/session/:sessionId/plugin/ai-appium-lens/aiAssert': {
            POST: {
                command: 'aiAssert',
                payloadParams: { required: ['text'] },
            },
        },
        '/session/:sessionId/plugin/ai-appium-lens/fetchUIElementsMetadataJson': {
            POST: {
                command: 'fetchUIElementsMetadataJsonaiAssert',
            },
        },
    };

    async askAI(next: Function, driver: any, ...args: any[]): Promise<any> {
        const instruction = args[0];
        const takeANewScreenShot = true;
        const sessionId = driver.sessionId;
        const screenshotPath = await this.getScreenshotPath(driver, sessionId, takeANewScreenShot);
        const base64Screenshot = fs.readFileSync(screenshotPath, 'base64');
        return await askGoogleVisionAI(instruction, base64Screenshot);
    }

    async aiAssert(next: Function, driver: any, ...args: any[]): Promise<any> {
        const instruction = args[0];
        const takeANewScreenShot = true;
        const sessionId = driver.sessionId;
        const modifiedInstruction = `${instruction}, and return the response strictly in only true/false, if you don't agree with the statement, return false, else true`;
        const screenshotPath = await this.getScreenshotPath(driver, sessionId, takeANewScreenShot);
        const base64Screenshot = fs.readFileSync(screenshotPath, 'base64');
        const response = await askGoogleVisionAI(modifiedInstruction, base64Screenshot);
        return response.replace(/\n/g, '');
    }


    async fetchUIElementsMetadataJsonaiAssert(next: Function, driver: any, ...args: any[]): Promise<any> {
        const modifiedInstruction = `return me a json in the form of what text you see, what color, what position, are aligned correctly, aligned/not aligned, also mention they are above/below which text, be specific, no mistake are allowed, set null if you don't find any data, example: {
            "text": "Home",
            "color": "black",
            "position": "bottom",
            "aligned": "not aligned",
            "above": "Enter mobile number",
            "below": "Upcoming match",
            "icon": "Home icon",
            "icon_color": "red",
            "icon_category": null,
            "UI Element": "Button",
            "UI Type": "tile"
        }`;
        const base64Screenshot = await this.takeScreenshot(driver);
        const response = await askGoogleVisionAI(modifiedInstruction, base64Screenshot);
        return response.replace(/```json|```/g, '').trim();
    }


    async aiClick(next: Function, driver: any, ...args: any[]): Promise<any> {
        const text = args[0];
        const index = args[1];
        const takeANewScreenShot = args[2];
        const sessionId = driver.sessionId;

        const screenshotPath = await this.getScreenshotPath(driver, sessionId, takeANewScreenShot);
        const coordinates = await getCoordinatesByInput(text, screenshotPath, takeANewScreenShot, sessionId, index);
        if (!coordinates) {
            throw new Error('Coordinates not found');
        }

        const multiplier = await this.getDeviceMultiplier(driver);
        let { x, y } = coordinates;
        x = x / multiplier;
        y = y / multiplier;

        const action = this.createClickAction(x, y);
        if (driver.performActions) {
            return await driver.performActions([action]);
        }

        throw new Error("Driver did not implement the 'performActions' command");
    }

    private async takeScreenshot(driver: any): Promise<string> {
        const b64Screenshot = await driver.getScreenshot();
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
        await fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
        const screenshotBuffer = fs.readFileSync(screenshotPath);
        return screenshotBuffer.toString('base64');
    }

    private async getScreenshotPath(driver: any, sessionId: string, takeANewScreenShot: boolean): Promise<string> {
        if (takeANewScreenShot) {
            const base64Screenshot = await this.takeScreenshot(driver);
            const screenshotsDir = path.join(__dirname, 'screenshots');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
            await fs.writeFileSync(screenshotPath, base64Screenshot, 'base64');

            let sessionData = sessions.findOne({ sessionId });
            if (sessionData) {
                sessionData.imageUrl = screenshotPath;
                sessions.update(sessionData);
            } else {
                sessions.insert({ sessionId, imageUrl: screenshotPath });
            }
            return screenshotPath;
        } else {
            const sessionData = sessions.findOne({ sessionId });
            if (sessionData) {
                return sessionData.imageUrl;
            } else {
                throw new Error('No existing screenshot found for this session');
            }
        }
    }

    private async getDeviceMultiplier(driver: any): Promise<number> {
        if (driver.constructor.name === 'AndroidUiautomator2Driver') {
            return 1;
        } else if (driver.constructor.name == 'XCUITestDriver') {
            const { width, height } = await driver.getWindowSize();
            return await getiOSDeviceMultiplier(width, height);
        }
        throw new Error('Unsupported driver type');
    }

    private createClickAction(x: number, y: number) {
        return {
            type: 'pointer' as const,
            id: 'mouse',
            parameters: { pointerType: 'touch' as const },
            actions: [
                { type: 'pointerMove' as const, x, y, duration: 0 },
                { type: 'pointerDown' as const, button: 0 },
                { type: 'pause' as const, duration: TAP_DURATION_MS },
                { type: 'pointerUp' as const, button: 0 },
            ]
        };
    }
}

export default AIAppiumLens;