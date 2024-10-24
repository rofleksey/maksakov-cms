'use strict';

/**
 * A set of functions called "actions" for `order`
 */
const stripTags = require("striptags");
const Mustache = require("mustache");
const fs = require("fs");

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

const htmlTemplate = fs.readFileSync("src/api/order/controllers/template.html", "utf8");

module.exports = {
  handleOrder: async (ctx, next) => {
    let {items, deliveryType, notes, name, phone, email} = ctx.request.body;

    if (!items || !items.length || !deliveryType || !deliveryTypeTextMap[deliveryType]
      || !name || !name.length || !phone || !phone.length || !email || !email.length) {
      return ctx.badRequest('bad request');
    }

    if (!notes || !notes.length) {
      notes = "";
    }

    const serverItems = await Promise.all(items.map((item) => strapi.service('api::product.product').findOne(item.id, {
      populate: "deep,3",
    })));

    let itemsPrice = 0;
    let deliveryPrice = deliveryTypePriceMap[deliveryType];

    const templateItems = items.map((clientItem, index) => {
      const serverItem = serverItems[index];
      const link = `${config.baseUrl}product?productId=${serverItem.id}&categoryId=${serverItem.category.id}`
      itemsPrice += serverItem.price * clientItem.count;

      let image = null

      if (serverItem.images_gallery?.length > 0) {
        image = `https://maksakov.com/cms${serverItem.images_gallery[0].formats.thumbnail.url}`
      } else if (serverItem.images_preview?.length > 0) {
        image = `https://maksakov.com/cms${serverItem.images_preview[0].formats.thumbnail.url}`
      }

      return {
        title: serverItem.name,
        link,
        image,
        basePrice: serverItem.price,
        count: clientItem.count,
        fullPrice: serverItem.price * clientItem.count,
      }
    });

    const templateData = {
      name: stripTags(name),
      email: stripTags(email),
      notes: stripTags(notes),
      phone: stripTags(phone),
      items: templateItems,
      basePrice: Math.round(itemsPrice),
      deliveryPrice,
      deliveryType: deliveryTypeTextMap[deliveryType],
      fullPrice: Math.round(itemsPrice + deliveryPrice)
    }

    const html = Mustache.render(htmlTemplate, templateData);

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
