module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/order',
      handler: 'order.handleOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
