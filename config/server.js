module.exports = ({env}) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: "https://cms.maksakov.com/",
  // url: "http://localhost/cms",
  app: {
    keys: env.array('APP_KEYS'),
  },
});
