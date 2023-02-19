module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/review',
      handler: 'review.handleReview',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
