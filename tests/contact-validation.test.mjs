import test from 'node:test';
import assert from 'node:assert/strict';
import validation from '../contact-validation.js';
const {isValidEmail,normalizePhone,formatPhone}=validation;

test('email validation accepts common addresses and rejects malformed destinations',()=>{
 for(const email of ['ad.soyad+teklif@gmail.com','info@firma.com.tr','hello@sub.example.org'])assert.equal(isValidEmail(email),true,email);
 for(const email of ['', 'a@b', 'a@@gmail.com','a..b@gmail.com','.a@gmail.com','a.@gmail.com','a@gmail..com','a@-gmail.com','a@gmail-.com','a@bad_domain.com','a@site.12','ad soyad@gmail.com','a@gmail.com,b@example.com','a\n@gmail.com'])assert.equal(isValidEmail(email),false,email);
});
test('Turkey phone numbers support national and international paste formats',()=>{
 for(const value of ['05321234567','5321234567','0532-123-45-67','+90 (532) 123 45 67','00905321234567','905321234567']){
  assert.equal(normalizePhone(value),'05321234567',value);
  assert.equal(formatPhone(value),'0532-123-45-67',value);
 }
 assert.equal(normalizePhone('0212-123-45-67'),'02121234567');
 assert.equal(normalizePhone('0850-123-45-67'),'08501234567');
});
test('missing, overlong, foreign and mixed text phone values are rejected',()=>{
 for(const value of ['',undefined,'0532','053212345678','00000000000','12345678901','0532abc1234567','+44 5321234567','+905321234567x'])assert.equal(normalizePhone(value),null,String(value));
 assert.equal(formatPhone('+4353212345'),'+4353212345');
 assert.equal(formatPhone('053212345678'),'0532-123-45-678');
});
test('partial formatting supports typing and clearing without placeholder digits',()=>{
 assert.equal(formatPhone(''),'');assert.equal(formatPhone('5'),'05');
 assert.equal(formatPhone('05321'),'0532-1');assert.equal(formatPhone('05321234'),'0532-123-4');
});
