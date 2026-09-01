const { createApp } = require('./app');

const PORT = process.env.PORT || 4001;
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`OTR-India | Anchal module listening on port ${PORT}`);
});
