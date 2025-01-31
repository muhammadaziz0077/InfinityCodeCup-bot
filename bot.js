const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = '7948647881:AAE8uBdzAOl57jXm7gFwyobKjmE_VmqzhyQ';
const CHANNEL_ID = '@InfinityCode_uz';
const ADMIN_GROUP_ID = -1002377606777;

const bot = new Telegraf(BOT_TOKEN);

// **Sessiyani faollashtirish**
bot.use(session());

bot.start(async (ctx) => {
    ctx.session = {}; // Foydalanuvchi uchun yangi sessiya yaratish
    const userId = ctx.from.id;

    try {
        const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`);
        const status = res.data.result.status;

        if (status === 'member' || status === 'administrator' || status === 'creator') {
            return ctx.reply("Siz ro'yxatdan o'tdingiz!", Markup.keyboard([['Homiylik qilish']]).resize());
        } else {
            return ctx.reply("Turnirda qatnashish uchun kanalga obuna bo'ling!", Markup.inlineKeyboard([
                [Markup.button.url("Obuna bo'lish", `https://t.me/${CHANNEL_ID.slice(1)}`)],
                [Markup.button.callback("Tekshirish", "check_sub")]
            ]));
        }
    } catch (error) {
        console.error(error);
        return ctx.reply("Xatolik yuz berdi. Keyinroq urinib ko'ring.");
    }
});

bot.hears('Homiylik qilish', async (ctx) => {
    if (!ctx.session) ctx.session = {}; // Sessiya bo'lmasa, yaratish
    ctx.session.step = 'name';
    await ctx.reply("Ismingizni kiriting:");
});

bot.on('text', async (ctx) => {
    if (!ctx.session) ctx.session = {}; // Sessiya mavjud bo'lmasa, yaratish

    const text = ctx.message.text;
    const userId = ctx.from.id;

    switch (ctx.session.step) {
        case 'name':
            ctx.session.name = text;
            ctx.session.step = 'surname';
            await ctx.reply("Familiyangizni kiriting:");
            break;
        case 'surname':
            ctx.session.surname = text;
            ctx.session.step = 'phone';
            await ctx.reply("Telefon raqamingizni kiriting:");
            break;
        case 'phone':
            ctx.session.phone = text;
            ctx.session.step = 'sponsor';
            await ctx.reply("Homiylik qilmoqchi bo'lgan kanal yoki botingizni kiriting:");
            break;
        case 'sponsor':
            ctx.session.sponsor = text;

            const message = `📌 *Yangi homiylik so'rovi!*
👤 Ism: ${ctx.session.name}
🧑‍💼 Familiya: ${ctx.session.surname}
📞 Telefon: ${ctx.session.phone}
📢 Homiylik obyekti: ${ctx.session.sponsor}`;

            await bot.telegram.sendMessage(ADMIN_GROUP_ID, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: "Bog'lanildi ✅", callback_data: `contacted_${userId}` }]]
                }
            });

            await ctx.reply("Siz ro'yxatdan o'tdingiz! Adminlar tez orada siz bilan bog'lanishadi.");
            ctx.session = {}; // Sessiyani tozalash
            break;
    }
});

bot.action(/contacted_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.answerCbQuery("Bog'lanildi tugmasi o'chirildi.");
});

bot.launch();
