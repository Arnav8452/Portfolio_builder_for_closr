import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[ai-gateway] Server listening on port ${PORT}`);
});
