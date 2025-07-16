import re
import asyncio
import random
import string
import traceback
from pyrogram import Client, filters, enums
from pyrogram.types import InlineKeyboardMarkup, InlineKeyboardButton, Message
from yt_dlp import YoutubeDL
from functions.user_database import yt_data  # replace with your actual import

# Regex for YouTube URLs
YT_LINK_RE = re.compile(
    r'(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w-]+'
)

def generate_id(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def sizeof_fmt(num, suffix='B'):
    for unit in ['','K','M','G','T']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1fP%s" % (num, suffix)

YTDL_OPTS = {
    'skip_download': True,
    'quiet': True,
    'no_warnings': True,
    'cookiefile': 'cookies.txt',
    'restrictfilenames': True,
    'format': 'bestvideo*+bestaudio/best',
    'forcejson': True,
    'extract_flat': False,
    'noplaylist': True,
    'cachedir': False,
    'outtmpl': '%(id)s.%(ext)s'
}

def process_yt_link(link: str, user_id: int) -> dict:
    data = {}
    try:
        with YoutubeDL(YTDL_OPTS) as ydl:
            info = ydl.extract_info(link, download=False)
        formats = info.get('formats', [])
        video_formats = []
        audio_formats = []
        has_audio = False

        for f in formats:
            if not f.get("url", "").startswith("https"):
                continue
            fmt_data = {
                "format_id": f.get('format_id'),
                "ext": f.get('ext'),
                "format_note": f.get('format_note'),
                "height": f.get('height'),
                "width": f.get('width'),
                "fps": f.get('fps'),
                "vcodec": f.get('vcodec'),
                "acodec": f.get('acodec'),
                "filesize": sizeof_fmt(f['filesize']) if f.get('filesize') else None,
                "filesize_bytes": f.get('filesize') or 0,
                "url": f.get('url'),
                "tbr": f.get('tbr'),
                "abr": f.get('abr'),
                "asr": f.get('asr')
            }
            # Set audio=None for video-only formats
            if f.get('vcodec') != 'none' and f.get('acodec') == 'none':
                fmt_data['audio'] = None
                video_formats.append(fmt_data)
            elif f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                audio_formats.append(fmt_data)
            elif f.get('acodec') != 'none' and f.get('vcodec') != 'none':
                video_formats.append(fmt_data)
                has_audio = True

        doc_key = generate_id()
        data = {
            "_id": doc_key,
            "link": link,
            "title": info.get('title'),
            "duration": info.get('duration'),
            "thumbnail": info.get('thumbnail'),
            "uploader": info.get('uploader'),
            "video_formats": video_formats,
            "audio_formats": audio_formats,
            "has_audio": has_audio,
            "user_id": user_id,
            "yt_id": info.get('id')
        }
        yt_data.insert_one(data)
    except Exception as e:
        traceback.print_exc()
        raise RuntimeError(f"YT-DLP error: {e}")
    return data

def build_inline_keyboard(doc: dict):
    # --- Video ---
    video_rows = []
    video_rows.append([InlineKeyboardButton("🎬 Videos", callback_data="dummy_videos")])

    # Map (height, fps) -> format with largest filesize
    unique_video_formats = {}
    for vfmt in doc['video_formats']:
        height = vfmt.get('height')
        fps = int(vfmt.get('fps') or 0)
        key = (height, fps)
        if key not in unique_video_formats or vfmt.get('filesize_bytes', 0) > unique_video_formats[key].get('filesize_bytes', 0):
            unique_video_formats[key] = vfmt

    # Sort by height desc, then fps desc
    sorted_formats = sorted(
        unique_video_formats.values(),
        key=lambda x: ((x['height'] or 0), int(x.get('fps') or 0)),
        reverse=True
    )

    # Show 3 per row
    for i in range(0, len(sorted_formats), 3):
        row = []
        for vfmt in sorted_formats[i:i+3]:
            label = ""
            if vfmt.get('height'):
                label += f"{vfmt['height']}p"
            else:
                label += "audio+video"
            if vfmt.get('fps'):
                label += f"@{vfmt['fps']}"
            if vfmt.get('filesize'):
                label += f" | {vfmt['filesize']}"
            cb = f"dl_{doc['_id']}_{vfmt['format_id']}"
            row.append(InlineKeyboardButton(label, callback_data=cb))
        video_rows.append(row)

    # --- Audio ---
    audio_rows = [[InlineKeyboardButton("🎵 Audios", callback_data="dummy_audios")]]
    audios = sorted(doc['audio_formats'], key=lambda x: int(x.get('abr', 0) or 0), reverse=True)
    for i in range(0, len(audios), 3):
        row = []
        for a in audios[i:i+3]:
            label = f"{a['ext']} {a.get('abr', 'N/A')}kbps"
            if a.get('filesize'):
                label += f" ({a['filesize']})"
            cb = f"dl_{doc['_id']}_{a['format_id']}"
            row.append(InlineKeyboardButton(label, callback_data=cb))
        audio_rows.append(row)

    markup = []
    markup.extend(video_rows)
    markup.extend(audio_rows)
    return InlineKeyboardMarkup(markup)

@Client.on_message(filters.regex(YT_LINK_RE, flags=re.IGNORECASE) & filters.private)
async def yt_link_handler(client: Client, message: Message):
    link = re.search(YT_LINK_RE, message.text.strip()).group(0)
    user_id = message.from_user.id
    msg = await message.reply("🔎 Processing YouTube link, please wait...")

    try:
        doc = await asyncio.to_thread(process_yt_link, link, user_id)
        caption = (
            f"**{doc.get('title', 'No Title')}**\n"
            f"Duration: `{doc.get('duration', 'N/A')}` seconds\n"
            f"[Thumbnail]({doc.get('thumbnail')})"
        )
        markup = build_inline_keyboard(doc)
        await msg.edit(
            caption, 
            reply_markup=markup,
            disable_web_page_preview=False,
            parse_mode=enums.ParseMode.MARKDOWN
        )
    except Exception as err:
        await msg.edit(f"❌ Error: {err}")
