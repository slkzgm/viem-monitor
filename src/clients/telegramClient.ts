// src/clients/telegramClient.ts

/**
 * Example optional Telegram client.
 * Same pattern: dynamic import, skipping if not installed or not configured.
 */

import { Logger } from '../logger'

export async function initTelegramClient(botToken: string): Promise<any | null> {
    try {
        const TelegramBot = (await import('node-telegram-bot-api')).default

        if (!botToken) {
            Logger.warn('Telegram bot token is empty. Skipping Telegram client initialization.')
            return null
        }

        const bot = new TelegramBot(botToken, { polling: false })
        Logger.info('Telegram client initialized successfully.')
        return bot
    } catch (error: any) {
        Logger.warn(`Could not load Telegram client. Error: ${error.message}`)
        return null
    }
}
