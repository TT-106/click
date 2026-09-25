import { decodeSave } from './save-validation.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ ok: true, state: decodeSave(data) }); }
  catch (error) { self.postMessage({ ok: false, error: error.message }); }
};
