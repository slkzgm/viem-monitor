// src/clients/twitterClient.ts

/**
 * Example optional Twitter client that uses your custom library
 * "agent-twitter-client" from https://github.com/bozoverse/agent-twitter-client
 */

import { Logger } from '../logger'

export async function initTwitterClient(
    username: string,
    password: string,
    email?: string,
    appKey?: string,
    appSecret?: string,
    accessToken?: string,
    accessSecret?: string
): Promise<any | null> {
    try {
        // If the user didn't install "agent-twitter-client", a dynamic import error will be caught
        const { Scraper } = await import('agent-twitter-client')

        if (!username || !password) {
            Logger.warn('Twitter credentials incomplete. Skipping Twitter client initialization.')
            return null
        }

        const scraper = new Scraper()

        // If you need advanced login (with email, etc.):
        if (email && appKey && appSecret && accessToken && accessSecret) {
            await scraper.login(
                username,
                password,
                email,
                appKey,
                appSecret,
                accessToken,
                accessSecret
            )
        } else {
            // Basic login
            await scraper.login(username, password)
        }

        Logger.info('Twitter client initialized and logged in successfully.')
        return scraper
    } catch (error: any) {
        Logger.warn(`Could not load Twitter client. Error: ${error.message}`)
        return null
    }
}
