import asyncio
import os

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()


dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: types.Message) -> None:
    if WEBAPP_URL.startswith("https://"):
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Открыть Mini App",
                        web_app=WebAppInfo(url=WEBAPP_URL),
                    )
                ]
            ]
        )
        await message.answer(
            "Нажми кнопку, чтобы открыть приложение.",
            reply_markup=keyboard,
        )
        return

    await message.answer(
        "WEBAPP_URL не задан.\n\n"
        "Для локальной проверки открой в браузере:\n"
        "http://localhost:5173\n\n"
        "Чтобы открывать Mini App из Telegram, нужен публичный HTTPS "
        "(хостинг вроде Vercel/Netlify), без туннеля."
    )


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("Задайте BOT_TOKEN в .env")
    bot = Bot(BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
