import { createQuoteHandler } from '../server/quote-mail.mjs';

const handler = createQuoteHandler();
export default { fetch: request => handler(request, process.env) };
