'use strict';

/**
 * A set of functions called "actions" for `review`
 */
const stripTags = require("striptags");

const config = {
  orderEmail: process.env.ORDER_EMAIL,
};

module.exports = {
  handleReview: async (ctx, next) => {
    let html = 'Новый отзыв!<br /><br />';

    const {name, emailAddress, phone, subject, message} = ctx.request.body;

    if (!name || !name.length
      || !emailAddress || !emailAddress.length
      || !phone || !phone.length
      || !subject || !subject.length
      || !message || !message.length) {
      return ctx.badRequest('bad request');
    }

    html += `Имя: ${stripTags(name)}<br />`;
    html += `Почта: ${stripTags(emailAddress)}<br />`;
    html += `Телефон: ${stripTags(phone)}<br /><br />`;
    html += `Тема: ${stripTags(subject)}<br />`;
    html += `Сообщение: ${stripTags(message)}<br />`;

    await strapi
      .plugin('email')
      .service('email')
      .send({
        to: config.orderEmail,
        subject: 'Отзыв',
        html,
      });

    ctx.body = 'ok';
  }
};
