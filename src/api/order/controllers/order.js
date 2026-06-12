'use strict';

/**
 * A set of functions called "actions" for `order`
 */
const stripTags = require("striptags");
const https = require("https");

const config = {
  orderEmail: process.env.ORDER_EMAIL,
  baseUrl: process.env.BASE_URL,
};

const ntfyConfig = {
  url: process.env.NTFY_URL,
  topic: process.env.NTFY_ORDER_TOPIC,
  token: process.env.NTFY_ORDER_TOKEN,
};

const deliveryTypeTextMap = {
  "pickup": "Самовывоз",
  "mail": "Почта России",
  "courier": "Курьер"
}

const deliveryTypePriceMap = {
  "pickup": 0,
  "mail": 500,
  "courier": 500
}

function notifyNtfy(title, message) {
  if (!ntfyConfig.token || !ntfyConfig.url || !ntfyConfig.topic) {
    return;
  }

  try {
    const req = https.request(`${ntfyConfig.url}/${ntfyConfig.topic}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ntfyConfig.token}`,
        'Title': `=?UTF-8?B?${Buffer.from(title).toString('base64')}?=`,
        'Priority': '4',
      },
      timeout: 5000,
    });

    req.on('error', (e) => { strapi.log.error('ntfy error:', e.message); });
    req.on('timeout', () => { strapi.log.error('ntfy timeout'); req.socket && req.socket.destroy(); });

    req.write(message);
    req.end();
  } catch (e) {
    strapi.log.error('ntfy exception:', e.message);
  }
}

module.exports = {
  handleOrder: async (ctx, next) => {
    let html = 'Создан новый заказ!<br /><br />';

    let {items, deliveryType, notes, name, phone, email} = ctx.request.body;

    if (!items || !items.length || !deliveryType || !deliveryTypeTextMap[deliveryType]
      || !name || !name.length || !phone || !phone.length || !email || !email.length) {
      return ctx.badRequest('bad request');
    }

    if (!notes || !notes.length) {
      notes = "";
    }

    const serverItems = await Promise.all(items.map((item) => strapi.service('api::product.product').findOne(item.id, {
      populate: 'category',
    })));

    let itemsPrice = 0;
    let deliveryPrice = deliveryTypePriceMap[deliveryType];
    let text = '';

    items.forEach((clientItem, index) => {
      const serverItem = serverItems[index];
      console.log(serverItem);
      const link = `${config.baseUrl}product?productId=${serverItem.id}&categoryId=${serverItem.category.id}`
      itemsPrice += serverItem.price * clientItem.count;
      html += `<a href="${link}">${index + 1}. ${serverItem.name}</a> (${serverItem.price} р. x ${clientItem.count} шт.)<br />`;
      text += `${index + 1}. ${serverItem.name} (${serverItem.price} р. x ${clientItem.count} шт.) ${link}\n`;
    });

    html += '<br /><br />';

    html += `Имя: ${stripTags(name)}<br />`;
    html += `Телефон: ${stripTags(phone)}<br />`;
    html += `Электронная почта: ${stripTags(email)}<br />`;
    html += `Комментарий: ${stripTags(notes)}<br /><br />`;

    text += `\nИмя: ${stripTags(name)}\n`;
    text += `Телефон: ${stripTags(phone)}\n`;
    text += `Электронная почта: ${stripTags(email)}\n`;
    text += `Комментарий: ${stripTags(notes)}\n\n`;

    itemsPrice = Math.round(itemsPrice);

    html += `Стоимость товаров: ${itemsPrice} р.<br />`;
    html += `Доставка (${deliveryTypeTextMap[deliveryType]}): ${deliveryPrice} р.<br />`;
    html += `Итого: ${Math.round(itemsPrice + deliveryPrice)} р.<br />`;

    html += '<br /><br />';

    text += `Стоимость товаров: ${itemsPrice} р.\n`;
    text += `Доставка (${deliveryTypeTextMap[deliveryType]}): ${deliveryPrice} р.\n`;
    text += `Итого: ${Math.round(itemsPrice + deliveryPrice)} р.`;

    await strapi
      .plugin('email')
      .service('email')
      .send({
        to: config.orderEmail,
        subject: 'Заказ',
        html,
      });

    strapi
      .plugin('email')
      .service('email')
      .send({
        to: "rofleksey@yandex.ru",
        subject: 'Debug Заказ',
        html,
      }).catch(() => {
    })

    notifyNtfy('Новый заказ', text);

    ctx.body = 'ok';
  }
};
