// app/api/webhook/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import { db } from '@/lib/db';

export const runtime = 'edge'; // optional: run as edge fn for minimal cold start

// register your commands / handlers here
function configureBot(bot: Bot, projectId: string) {
  bot.command('start', ctx => {
    console.log(`[${projectId}] /start from`, ctx.from?.id);
    return ctx.reply(`👋 Hello from project ${projectId}!`);
  });

  bot.command('help', ctx => {
    return ctx.reply(
      `I can:\n` +
      `/start — say hello\n` +
      `/help — show this message`
    );
  });

  // …other commands…
}

export async function POST(request: NextRequest) {
  // 1️⃣ verify Telegram is calling us with the right secret
  const projectId = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!projectId) {
    console.warn('Missing projectId in headers');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2️⃣ fetch your Telegram settings by that secret
  //    (assuming you used your botToken as the secret_token)
  // const settings = await db.telegramSettings.findFirst({
  //   where: { projectId }
  // });
  // if (!settings) {
  //   console.warn('No project found for projectId:', projectId);
  //   return new NextResponse('Not found', { status: 404 });
  // }

  // 3️⃣ re-hydrate your bot instance and commands
  const bot = new Bot('8112882451:AAEMTI8wsMiI9ugUKR0J-6WVYYQGAzZRTuA');
  configureBot(bot, 'cma4u06vf0001rzjxld2e7f21');

  // 4️⃣ dispatch the update payload
  const update = await request.json();
  try {
    await bot.handleUpdate(update);
  } catch (err) {
    // console.error(`Error handling update for project ${settings.projectId}:`, err);
  }

  // 5️⃣ acknowledge immediately
  return new NextResponse('OK');
}

export async function GET(request: NextRequest) {
  // 1️⃣ verify Telegram is calling us with the right secret
  const projectId = request.headers.get('x-telegram-bot-api-secret-token');
  if (!projectId) {
    console.warn('Missing projectId in headers');
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // 5️⃣ acknowledge immediately
  return new NextResponse('Recieved Successfully projectId');
}
