'use strict';

/**
 * A set of functions called "actions" for `order`
 */
const stripTags = require("striptags");

const config = {
  orderEmail: process.env.ORDER_EMAIL,
  baseUrl: process.env.BASE_URL,
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

    items.forEach((clientItem, index) => {
      const serverItem = serverItems[index];
      console.log(serverItem);
      const link = `${config.baseUrl}product?productId=${serverItem.id}&categoryId=${serverItem.category.id}`
      itemsPrice += serverItem.price * clientItem.count;
      html += `<a href="${link}">${index + 1}. ${serverItem.name}</a> (${serverItem.price} р. x ${clientItem.count} шт.)<br />`;
    });

    html += '<br /><br />';

    html += `Имя: ${stripTags(name)}<br />`;
    html += `Телефон: ${stripTags(phone)}<br />`;
    html += `Электронная почта: ${stripTags(email)}<br />`;
    html += `Комментарий: ${stripTags(notes)}<br /><br />`;

    itemsPrice = Math.round(itemsPrice);

    html += `Стоимость товаров: ${itemsPrice} р.<br />`;
    html += `Доставка (${deliveryTypeTextMap[deliveryType]}): ${deliveryPrice} р.<br />`;
    html += `Итого: ${Math.round(itemsPrice + deliveryPrice)} р.<br />`;

    html += '<br /><br />';

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

    ctx.body = 'ok';
  }
};
