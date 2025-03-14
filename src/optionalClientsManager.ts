// src/optionalClientsManager.ts

/**
 * This file orchestrates which clients to initialize based on config
 * (e.g., ENABLE_DISCORD, ENABLE_TELEGRAM, ENABLE_TWITTER).
 */

import { ENABLE_DISCORD, ENABLE_TELEGRAM, ENABLE_TWITTER, TWITTER_USERNAME, TWITTER_PASSWORD } from './config'
import { initDiscordClient } from './clients/discordClient'
import { initTelegramClient } from './clients/telegramClient'
import { initTwitterClient } from './clients/twitterClient'
import { Logger } from './logger'

export class OptionalClientsManager {
    public discordClient: any | null = null
    public telegramClient: any | null = null
    public twitterScraper: any | null = null

    public async initAll(): Promise<void> {
        // 1) Discord
        if (ENABLE_DISCORD) {
            // If you store the Discord token in an env var:
            const DISCORD_TOKEN = process.env.DISCORD_TOKEN || ''
            this.discordClient = await initDiscordClient(DISCORD_TOKEN)
        } else {
            Logger.info('Discord client is disabled in config.')
        }

        // 2) Telegram
        if (ENABLE_TELEGRAM) {
            const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || ''
            this.telegramClient = await initTelegramClient(TELEGRAM_TOKEN)
        } else {
            Logger.info('Telegram client is disabled in config.')
        }

        // 3) Twitter
        if (ENABLE_TWITTER) {
            // You could also define these in config.ts, or rely on process.env directly
            const email = process.env.TWITTER_EMAIL
            const appKey = process.env.TWITTER_APP_KEY
            const appSecret = process.env.TWITTER_APP_SECRET
            const accessToken = process.env.TWITTER_ACCESS_TOKEN
            const accessSecret = process.env.TWITTER_ACCESS_SECRET

            this.twitterScraper = await initTwitterClient(
                TWITTER_USERNAME,
                TWITTER_PASSWORD,
                email,
                appKey,
                appSecret,
                accessToken,
                accessSecret
            )
        } else {
            Logger.info('Twitter client is disabled in config.')
        }

        Logger.info('Optional clients initialization completed.')
    }

    /**
     * Example: You might have a method to broadcast a message to all enabled
     * clients (Discord, Telegram, Twitter).
     */
    public async broadcastMessage(message: string): Promise<void> {
        // 1) Discord
        if (this.discordClient) {
            // Pseudocode for sending a message
            try {
                await this.discordClient.sendMessage('#channel', message)
                Logger.info('[Discord] Message sent successfully.')
            } catch (err: any) {
                Logger.error(`[Discord] Error sending message: ${err.message}`)
            }
        }

        // 2) Telegram
        if (this.telegramClient) {
            try {
                // Example usage
                await this.telegramClient.sendMessage('YOUR_CHAT_ID', message)
                Logger.info('[Telegram] Message sent successfully.')
            } catch (err: any) {
                Logger.error(`[Telegram] Error sending message: ${err.message}`)
            }
        }

        // 3) Twitter
        if (this.twitterScraper) {
            try {
                await this.twitterScraper.sendTweet(message)
                Logger.info('[Twitter] Tweet sent successfully.')
            } catch (err: any) {
                Logger.error(`[Twitter] Error sending tweet: ${err.message}`)
            }
        }
    }
}
