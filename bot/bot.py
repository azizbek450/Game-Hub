import sys
import os
import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    ReplyKeyboardMarkup, 
    KeyboardButton
)

# Loyihaning ildiz papkasini sys.path'ga kiritish
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import settings

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = getattr(settings, "BOT_TOKEN", "8958280158:AAGtVz2QFY--uvXaNO3FZoHs3oDdOW8X5MM")
WEBAPP_URL = getattr(settings, "WEBAPP_URL", "https://private-grove-unhidden.ngrok-free.dev/app/")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Asosiy tugmalar menyusi (Reply Keyboard)
main_menu_keyboard = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="🎮 Do'konni ochish", web_app=types.WebAppInfo(url=WEBAPP_URL))],
        [KeyboardButton(text="💰 Mening balansim"), KeyboardButton(text="📦 Buyurtmalarim")],
        [KeyboardButton(text="ℹ️ Yordam / Qo'llab-quvvatlash")]
    ],
    resize_keyboard=True
)

# --- /START BUYRUG'I ---
@dp.message(CommandStart())
async def start_cmd(message: types.Message):
    full_name = message.from_user.full_name

    inline_btn = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎮 GameHub Mini App-ni ochish",
                    web_app=types.WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )

    await message.answer(
        f"Xush kelibsiz, <b>{full_name}</b>!\n\n"
        f"GameHub orqali o'yinlar uchun UC va skinlarni oson va xavfsiz xarid qilishingiz mumkin.\n"
        f"Pastdagi menyu orqali do'konni oching yoki balansingizni tekshiring.",
        parse_mode="HTML",
        reply_markup=main_menu_keyboard
    )

# --- MENING BALANSIM ---
@dp.message(F.text == "💰 Mening balansim")
async def show_balance(message: types.Message):
    # Kelajakda bu joyda FastAPI API'dan real balans tortiladi
    user_id = message.from_user.id
    await message.answer(
        f"🆔 <b>Sizning Telegram ID:</b> <code>{user_id}</code>\n"
        f"💳 <b>Hamyon balansi:</b> 0 so'm\n\n"
        f"<i>Balansni to'ldirish uchun administratorga murojaat qiling yoki Mini App orqali to'lov qiling.</i>",
        parse_mode="HTML"
    )

# --- BUYURTMALARIM ---
@dp.message(F.text == "📦 Buyurtmalarim")
async def show_orders(message: types.Message):
    await message.answer(
        "📦 <b>Sizning oxirgi buyurtmalaringiz:</b>\n\n"
        "Hozircha hech qanday buyurtma bermagansiz.",
        parse_mode="HTML"
    )

# --- YORDAM ---
@dp.message(F.text == "ℹ️ Yordam / Qo'llab-quvvatlash")
async def show_help(message: types.Message):
    await message.answer(
        "❓ <b>Yordam markazi</b>\n\n"
        "Muammo yoki savollaringiz bo'lsa, adminga murojaat qilishingiz mumkin:\n"
        "👨‍💻 <b>Admin:</b> @admin_username",
        parse_mode="HTML"
    )

async def main():
    print("🚀 Bot menyular bilan qayta ishga tushdi...")
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())