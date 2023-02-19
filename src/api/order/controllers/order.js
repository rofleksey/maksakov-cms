'use strict';

/**
 * A set of functions called "actions" for `order`
 */
const stripTags = require("striptags");

const config = {
  orderEmail: process.env.ORDER_EMAIL,
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

    const {items, deliveryType, notes} = ctx.request.body;

    if (!items || !items.length || !deliveryType || !deliveryTypeTextMap[deliveryType] || !notes || !notes.length) {
      return ctx.badRequest('bad request');
    }

    const serverItems = await Promise.all(items.map((item) => strapi.service('api::product.product').findOne(item.id)));

    let itemsPrice = 0;
    let deliveryPrice = deliveryTypePriceMap[deliveryType];

    items.forEach((clientItem, index) => {
      const serverItem = serverItems[index];
      itemsPrice += serverItem.price * clientItem.count;
      html += `${index + 1}. ${serverItem.name} (${serverItem.price} р. x ${clientItem.count} шт.)<br />`;
    });

    html += `<br /><br />Комментарий: ${stripTags(notes)}<br /><br />`;

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

    ctx.body = 'ok';
  }
};
