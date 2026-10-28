/* Shared by the browser form and the mail API. */
((root) => {
  'use strict';
  function isValidEmail(value) {
    if(typeof value!=='string'||value.length>120)return false;
    const parts=value.split('@');
    if(parts.length!==2)return false;
    const [local,domain]=parts;
    return local.length>0 && local.length<=64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..')
      && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)
      && domain.length<=253 && domain.includes('.') && domain.split('.').every(label=>/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label))
      && /^[a-zA-Z]{2,63}$/.test(domain.split('.').at(-1));
  }
  function normalizePhone(value) {
    if(typeof value!=='string'||value.length>30||!/^\+?[\d()\s.-]+$/.test(value))return null;
    let digits=value.replace(/\D/g,'');
    if(value.startsWith('+')&&!digits.startsWith('90'))return null;
    if(digits.startsWith('0090'))digits=digits.slice(4);
    else if(digits.length===12&&digits.startsWith('90'))digits=digits.slice(2);
    if(digits.length===10)digits='0'+digits;
    return /^0(?:[2-5]\d{9}|850\d{7})$/.test(digits)?digits:null;
  }
  function formatPhone(value) {
    if(!/^[\d+()\s.-]*$/.test(value))return value;
    if(value.startsWith('+')&&!value.startsWith('+90'))return value;
    let digits=value.replace(/\D/g,'');
    if(digits.startsWith('0090'))digits='0'+digits.slice(4);
    else if((value.startsWith('+90')||digits.length===12)&&digits.startsWith('90'))digits='0'+digits.slice(2);
    else if(/^[2-5]/.test(digits)||digits.startsWith('850'))digits='0'+digits;
    return [digits.slice(0,4),digits.slice(4,7),digits.slice(7,9),digits.slice(9)].filter(Boolean).join('-');
  }
  const validation={isValidEmail,normalizePhone,formatPhone};
  if(typeof module==='object'&&module.exports)module.exports=validation;
  else root.contactValidation=validation;
})(typeof window==='object'?window:globalThis);
