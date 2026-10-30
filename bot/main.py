import asyncio
import os
from urllib.parse import quote

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip().rstrip("/")


dp = Dispatcher()


def webapp_keyboard(path: str = "") -> InlineKeyboardMarkup | None:
    if not WEBAPP_URL.startswith("https://"):
        return None
    url = f"{WEBAPP_URL}{path}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Открыть Mini App", web_app=WebAppInfo(url=url))]
        ]
    )


def invite_share_keyboard(bot_username: str, code: str) -> InlineKeyboardMarkup:
    invite = f"https://t.me/{bot_username}?start=join_{code}"
    share = (
        "https://t.me/share/url"
        f"?url={quote(invite, safe='')}"
        f"&text={quote('Присоединяйся к комнате D&D!', safe='')}"
    )
    rows = [
        [InlineKeyboardButton(text="Пригласить из контактов", url=share)],
    ]
    app_kb = webapp_keyboard(f"?room={code}")
    if app_kb:
        rows.append(app_kb.inline_keyboard[0])
    return InlineKeyboardMarkup(inline_keyboard=rows)


@dp.message(CommandStart())
async def start(message: types.Message, bot: Bot) -> None:
    payload = ""
    if message.text and " " in message.text:
        payload = message.text.split(maxsplit=1)[1].strip()

    me = await bot.get_me()
    bot_username = me.username or ""

    if payload.startswith("join_"):
        code = payload.removeprefix("join_").strip().upper()
        kb = webapp_keyboard(f"?room={code}")
        text = (
            f"Приглашение в комнату `{code}`.\n"
            "Открой Mini App, чтобы присоединиться."
        )
        await message.answer(text, reply_markup=kb, parse_mode="Markdown")
        return

    if payload.startswith("room_"):
        code = payload.removeprefix("room_").strip().upper()
        await message.answer(
            f"Комната `{code}`.\nПригласи игроков из контактов Telegram:",
            reply_markup=invite_share_keyboard(bot_username, code),
            parse_mode="Markdown",
        )
        return

    kb = webapp_keyboard()
    if kb:
        await message.answer(
            "D&D Mini App: создай комнату как мастер и пригласи игроков.",
            reply_markup=kb,
        )
        return

    await message.answer("WEBAPP_URL не задан в .env")


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("Задайте BOT_TOKEN в .env")
    bot = Bot(BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
